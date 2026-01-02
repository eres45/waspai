import { supabaseRest } from "../../supabase-rest";
import { WorkflowRepository } from "app-types/workflow";
import { NodeKind } from "lib/ai/workflow/workflow.interface";
import { createUINode } from "lib/ai/workflow/create-ui-node";
import {
  convertUINodeToDBNode,
  defaultObjectJsonSchema,
} from "lib/ai/workflow/shared.workflow";
import { generateUUID } from "lib/utils";

export const restWorkflowRepository: WorkflowRepository = {
  async selectToolByIds(ids) {
    if (!ids.length) return [];

    // This involves a join between workflow and workflow_node.
    // We need workflows where id is in ids, published=true, and join with INPUT nodes.
    const { data, error } = await supabaseRest
      .from("workflow")
      .select(`
        id,
        name,
        description,
        workflow_node!inner(
          node_config
        )
      `)
      .in("id", ids)
      .eq("is_published", true)
      .eq("workflow_node.kind", NodeKind.Input);

    if (error) throw error;

    return data.map((item: any) => {
      // The join usually returns an array for the 1-to-many relation,
      // but we filtered for specific kind, so usually one.
      const node = item.workflow_node?.[0];
      const schema =
        node?.node_config?.outputSchema ||
        structuredClone(defaultObjectJsonSchema);

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        schema,
      };
    });
  },

  async selectExecuteAbility(userId) {
    // published=true AND (userId=me OR visibility!=private)
    const { data, error } = await supabaseRest
      .from("workflow")
      .select("*, user:user_id(name, image)")
      .eq("is_published", true)
      .or(`user_id.eq.${userId},visibility.neq.private`);

    if (error) throw error;

    return data.map(mapWorkflowSummaryResponse);
  },

  async selectAll(userId) {
    // (visibility in [public, readonly]) OR userId=me
    const { data, error } = await supabaseRest
      .from("workflow")
      .select("*, user:user_id(name, image)")
      .or(`visibility.in.(public,readonly),user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map(mapWorkflowSummaryResponse);
  },

  async selectById(id) {
    const { data, error } = await supabaseRest
      .from("workflow")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null; // Or throw if strictly needed
    return mapWorkflowResponse(data);
  },

  async checkAccess(workflowId, userId, readOnly = true) {
    const { data, error } = await supabaseRest
      .from("workflow")
      .select("visibility, user_id")
      .eq("id", workflowId)
      .single();

    if (error || !data) return false;

    if (data.user_id === userId) return true;
    if (data.visibility === "private") return false;
    if (data.visibility === "readonly" && !readOnly) return false;
    return true;
  },

  async delete(id) {
    const { error } = await supabaseRest.from("workflow").delete().eq("id", id);

    if (error) throw error;
  },

  async selectByUserId(userId) {
    const { data, error } = await supabaseRest
      .from("workflow")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(mapWorkflowResponse);
  },

  async save(workflow, noGenerateInputNode = false) {
    const isNew = !workflow.id;
    const id = workflow.id || generateUUID();

    // Upsert workflow
    const { data, error } = await supabaseRest
      .from("workflow")
      .upsert({
        id,
        name: workflow.name,
        description: workflow.description,
        icon: workflow.icon,
        is_published: workflow.isPublished ?? false,
        visibility: workflow.visibility ?? "private",
        user_id: workflow.userId,
        version: workflow.version ?? "0.1.0",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    if (isNew && !noGenerateInputNode) {
      const startNode = createUINode(NodeKind.Input);
      const dbNode = convertUINodeToDBNode(id, startNode);

      await supabaseRest.from("workflow_node").insert({
        id: dbNode.id,
        workflow_id: id,
        kind: dbNode.kind,
        name: "INPUT",
        description: dbNode.description,
        ui_config: dbNode.uiConfig,
        node_config: dbNode.nodeConfig,
        updated_at: new Date().toISOString(),
      });
    }

    return mapWorkflowResponse(data);
  },

  async saveStructure({ workflowId, nodes, edges, deleteNodes, deleteEdges }) {
    // REST API cannot do single atomic transaction for multiple tables easily.
    // We execute sequentially.

    // 1. Delete Nodes
    if (deleteNodes?.length) {
      await supabaseRest
        .from("workflow_node")
        .delete()
        .eq("workflow_id", workflowId)
        .in("id", deleteNodes);
    }

    // 2. Delete Edges
    if (deleteEdges?.length) {
      await supabaseRest
        .from("workflow_edge")
        .delete()
        .eq("workflow_id", workflowId)
        .in("id", deleteEdges);
    }

    // 3. Upsert Nodes
    if (nodes?.length) {
      const mappedNodes = nodes.map((n) => ({
        id: n.id,
        workflow_id: n.workflowId,
        kind: n.kind,
        name: n.name,
        description: n.description,
        ui_config: n.uiConfig,
        node_config: n.nodeConfig,
        updated_at: new Date().toISOString(),
      }));

      await supabaseRest.from("workflow_node").upsert(mappedNodes);
    }

    // 4. Upsert Edges
    if (edges?.length) {
      const mappedEdges = edges.map((e) => ({
        id: e.id,
        workflow_id: e.workflowId,
        source: e.source,
        target: e.target,
        ui_config: e.uiConfig,
      }));

      await supabaseRest
        .from("workflow_edge")
        .upsert(mappedEdges, { ignoreDuplicates: true }); // equivalent to onConflictDoNothing roughly, or we use upsert
    }
  },

  async selectStructureById(id, opt) {
    const { data: workflow, error: wfError } = await supabaseRest
      .from("workflow")
      .select("*")
      .eq("id", id)
      .single();

    if (wfError || !workflow) return null;

    let nodeQuery = supabaseRest
      .from("workflow_node")
      .select("*")
      .eq("workflow_id", id);

    if (opt?.ignoreNote) {
      nodeQuery = nodeQuery.neq("kind", NodeKind.Note);
    }

    const { data: nodes, error: nodeError } = await nodeQuery;
    const { data: edges, error: edgeError } = await supabaseRest
      .from("workflow_edge")
      .select("*")
      .eq("workflow_id", id);

    if (nodeError) throw nodeError;
    if (edgeError) throw edgeError;

    return {
      ...mapWorkflowResponse(workflow),
      nodes: nodes.map(mapNodeResponse),
      edges: edges.map(mapEdgeResponse),
    };
  },
};

function mapWorkflowResponse(item: any): any {
  if (!item) return item;
  return {
    id: item.id,
    version: item.version,
    name: item.name,
    icon: item.icon,
    description: item.description,
    isPublished: item.is_published,
    visibility: item.visibility,
    userId: item.user_id,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  };
}

function mapWorkflowSummaryResponse(item: any): any {
  const mapped = mapWorkflowResponse(item);
  mapped.userName = item.user?.name;
  mapped.userAvatar = item.user?.image;
  return mapped;
}

function mapNodeResponse(item: any): any {
  return {
    id: item.id,
    version: item.version,
    workflowId: item.workflow_id,
    kind: item.kind,
    name: item.name,
    description: item.description,
    uiConfig: item.ui_config,
    nodeConfig: item.node_config,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  };
}

function mapEdgeResponse(item: any): any {
  return {
    id: item.id,
    version: item.version,
    workflowId: item.workflow_id,
    source: item.source,
    target: item.target,
    uiConfig: item.ui_config,
    createdAt: new Date(item.created_at),
  };
}
