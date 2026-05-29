import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import React from "react";

type WelcomeEmailProps = {
  userName?: string;
  dashboardUrl?: string;
  inviteUrl?: string;
};

const baseUrl = "https://waspai.app";

const iconWrap =
  "mx-auto flex h-[66px] w-[66px] items-center justify-center rounded-[14px] bg-[#1b1c20] text-center shadow-[inset_0_1px_16px_rgba(255,255,255,0.08),0_0_24px_rgba(255,255,255,0.05)]";

const lightBeamSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="722" height="650" viewBox="0 0 722 650">
  <defs>
    <filter id="soft" x="-120" y="-120" width="980" height="900" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="30"/>
    </filter>
    <filter id="softCore" x="-80" y="-80" width="900" height="820" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="16"/>
    </filter>
    <filter id="dustGlow" x="-10" y="-10" width="30" height="30">
      <feGaussianBlur stdDeviation="0.35"/>
    </filter>
    <linearGradient id="beam" x1="714" y1="0" x2="390" y2="470" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity="0.78"/>
      <stop offset="0.18" stop-color="#fff3df" stop-opacity="0.34"/>
      <stop offset="0.48" stop-color="#b9aa8f" stop-opacity="0.11"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="beamCore" x1="716" y1="0" x2="488" y2="330" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity="0.46"/>
      <stop offset="0.24" stop-color="#fff7e8" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="source" cx="0" cy="0" r="1" gradientTransform="translate(697 18) rotate(142) scale(88 58)" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity="0.92"/>
      <stop offset="0.4" stop-color="#fff5e4" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <path d="M722 0H594C550 78 511 167 477 266C447 353 415 430 370 520H520C556 392 610 196 722 0Z" fill="url(#beam)" filter="url(#soft)" opacity="0.82"/>
  <path d="M722 0H663C619 70 581 150 550 235C524 307 498 370 462 444H532C571 315 627 138 722 0Z" fill="url(#beamCore)" filter="url(#softCore)" opacity="0.64"/>
  <ellipse cx="700" cy="14" rx="88" ry="54" fill="url(#source)" filter="url(#soft)"/>
  <g fill="#fff7e8" filter="url(#dustGlow)">
    <circle cx="606" cy="31" r="1.25" opacity="0.9"/>
    <circle cx="578" cy="59" r="0.95" opacity="0.55"/>
    <circle cx="535" cy="102" r="0.9" opacity="0.42"/>
    <circle cx="629" cy="118" r="1.05" opacity="0.44"/>
    <circle cx="522" cy="155" r="0.85" opacity="0.38"/>
    <circle cx="642" cy="191" r="0.8" opacity="0.36"/>
    <circle cx="577" cy="230" r="0.7" opacity="0.28"/>
  </g>
</svg>`);

const lightBeamBackground = `url("data:image/svg+xml,${lightBeamSvg}")`;

const heroBackground = [
  "linear-gradient(to bottom, rgba(3,4,5,0) 0px, rgba(3,4,5,0) 360px, rgba(3,4,5,0.74) 475px, #030405 620px)",
  "radial-gradient(circle at 50% 229px, rgba(245,247,250,0.9) 0px, rgba(218,224,232,0.42) 2px, rgba(218,224,232,0.11) 12px, transparent 74px)",
  "radial-gradient(ellipse at 50% 224px, rgba(232,237,244,0.12) 0%, transparent 27%)",
  "linear-gradient(#030405, #030405)",
].join(", ");

const featureCards = [
  {
    title: "AI Agents",
    body: "Create intelligent agents to automate any task.",
    icon: (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
        <rect
          x="7"
          y="12"
          width="20"
          height="15"
          rx="5"
          stroke="#f7f7f7"
          strokeWidth="2.2"
        />
        <path
          d="M17 8v4"
          stroke="#f7f7f7"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="12.5" cy="19.5" r="1.8" fill="#f7f7f7" />
        <circle cx="21.5" cy="19.5" r="1.8" fill="#f7f7f7" />
        <path
          d="M4 18.5h3M27 18.5h3"
          stroke="#f7f7f7"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M13 25h8"
          stroke="#f7f7f7"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="17" cy="6" r="2" fill="#f7f7f7" />
      </svg>
    ),
  },
  {
    title: "Workflows",
    body: "Build powerful automations in minutes.",
    icon: (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
        <rect
          x="5"
          y="5"
          width="12"
          height="10"
          rx="2"
          stroke="#f7f7f7"
          strokeWidth="2.2"
        />
        <rect
          x="18"
          y="20"
          width="11"
          height="9"
          rx="2"
          stroke="#f7f7f7"
          strokeWidth="2.2"
        />
        <path
          d="M17 10h6c2.2 0 4 1.8 4 4v1M17 25h-6c-2.2 0-4-1.8-4-4v-1"
          stroke="#f7f7f7"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M24 12.5 27 15l3-2.5M10 21.5 7 19l-3 2.5"
          stroke="#f7f7f7"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Websites",
    body: "Generate modern, responsive websites instantly.",
    icon: (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
        <circle cx="17" cy="17" r="12.5" stroke="#f7f7f7" strokeWidth="2.3" />
        <path
          d="M4.5 17h25M17 4.5c4 3.9 5.8 8.1 5.8 12.5S21 25.6 17 29.5M17 4.5c-4 3.9-5.8 8.1-5.8 12.5S13 25.6 17 29.5"
          stroke="#f7f7f7"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "100+ AI Models",
    body: "Access the best models in one unified workspace.",
    icon: (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
        <path
          d="M17 5.5c1.4 6 5.1 9.7 11 11-5.9 1.4-9.6 5.1-11 11-1.4-5.9-5.1-9.6-11-11 5.9-1.3 9.6-5 11-11Z"
          fill="#f7f7f7"
        />
        <path
          d="M7 5v4M5 7h4M27 24v5M24.5 26.5h5"
          stroke="#f7f7f7"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function Logo({ muted = false }: { muted?: boolean }) {
  return (
    <Row className="mx-auto w-auto">
      <Column className="w-[52px] align-middle">
        <Img
          alt="WaspAI"
          className="block"
          height="30"
          src={`${baseUrl}/static/waspai-logo-transparent.png`}
          style={{ opacity: muted ? 0.86 : 1 }}
          width="46"
        />
      </Column>
      <Column className="align-middle">
        <Text
          className={`m-0 pl-[12px] text-[21px] font-semibold leading-none tracking-[11px] ${
            muted ? "text-[#d6d6d6]" : "text-white"
          }`}
        >
          WASPAI
        </Text>
      </Column>
    </Row>
  );
}

export function WaspAIWelcomeEmail({
  userName = "{{user_name}}",
  dashboardUrl = `${baseUrl}/dashboard`,
  inviteUrl = `${baseUrl}/dashboard/invite`,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to WaspAI. Your workspace is now active.</Preview>
      <Tailwind>
        <Body className="m-0 bg-[#111214] px-0 py-[42px] font-sans text-white">
          <Container className="mx-auto w-full max-w-[722px] rounded-[18px] border border-[#3a3b3f] bg-[#030405] p-0 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_80px_rgba(0,0,0,0.8)]">
            <Section
              className="overflow-hidden rounded-t-[18px] px-[43px] pb-[56px] pt-[66px] text-center"
              style={{
                backgroundImage: `${lightBeamBackground}, ${heroBackground}`,
                backgroundRepeat: "no-repeat, no-repeat",
                backgroundSize: "100% 650px, 100% 100%",
                backgroundColor: "#030405",
              }}
            >
              <Logo />

              <Section className="pt-[84px]">
                <Heading className="m-0 text-[55px] font-extrabold leading-[1.13] tracking-normal text-white">
                  Welcome to
                  <br />
                  <span className="text-[#c7c7c9]">WaspAI</span>
                </Heading>
                <Section
                  className="mx-auto mt-[30px] h-[1px] w-[180px]"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(232,237,244,0.12) 35%, rgba(245,247,250,0.95) 50%, rgba(232,237,244,0.12) 65%, transparent 100%)",
                    boxShadow: "0 0 18px rgba(226,232,240,0.5)",
                  }}
                />
                <Section className="mx-auto w-[460px] pt-[31px] text-center">
                  <Text className="m-0 text-center text-[23px] font-bold leading-[1.3] text-white">
                    Hi {userName}! &#128075;
                  </Text>
                  <Text className="m-0 pt-[22px] text-center text-[17px] leading-[1.65] text-[#d0d0d3]">
                    Your workspace is now active.
                  </Text>
                  <Text className="m-0 pt-[15px] text-center text-[17px] leading-[1.65] text-[#d0d0d3]">
                    You now have access to the most powerful AI models,
                    <br />
                    agents, and tools -- all in one place.
                  </Text>
                </Section>
                <Button
                  className="mt-[34px] rounded-[10px] bg-[#fbfbfb] px-[66px] py-[20px] text-[17px] font-bold text-[#101010] shadow-[0_0_34px_rgba(255,255,255,0.36)]"
                  href={dashboardUrl}
                >
                  Open Dashboard&nbsp;&nbsp;&nbsp; &#8594;
                </Button>
              </Section>

              <Section className="pt-[60px]">
                <Text className="m-0 text-[21px] font-bold leading-[1.35] text-white">
                  What you can do with WaspAI
                </Text>
                <Row className="mt-[30px]">
                  {featureCards.map((feature) => (
                    <Column
                      key={feature.title}
                      className="w-1/4 px-[7px] text-center align-top"
                    >
                      <Section className="h-[206px] rounded-[9px] border border-[#292b31] bg-[#111215] px-[13px] py-[28px] text-center shadow-[inset_0_1px_24px_rgba(255,255,255,0.035)]">
                        <div className={iconWrap}>{feature.icon}</div>
                        <Text className="m-0 pt-[23px] text-center text-[15px] font-bold leading-[1.25] text-white">
                          {feature.title}
                        </Text>
                        <Text className="mx-auto m-0 max-w-[112px] pt-[15px] text-center text-[13px] leading-[1.65] text-[#d2d2d5]">
                          {feature.body}
                        </Text>
                      </Section>
                    </Column>
                  ))}
                </Row>
              </Section>

              <Section className="mt-[48px] rounded-[9px] border border-[#24262b] bg-[#0c0d0f] px-[56px] py-[34px] text-left shadow-[inset_0_1px_32px_rgba(255,255,255,0.035)]">
                <Row>
                  <Column className="w-[210px] text-center align-middle">
                    <Section className="mx-auto h-[92px] w-[128px] rounded-[18px] bg-[#17181b] text-center shadow-[0_0_34px_rgba(226,232,240,0.22),inset_0_0_22px_rgba(255,255,255,0.06)]">
                      <svg
                        width="96"
                        height="76"
                        viewBox="0 0 96 76"
                        fill="none"
                        className="mt-[7px]"
                      >
                        <rect
                          x="11"
                          y="17"
                          width="58"
                          height="42"
                          rx="6"
                          stroke="#fafafa"
                          strokeWidth="3"
                        />
                        <path
                          d="M13 21l27 22 27-22"
                          stroke="#fafafa"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="71"
                          cy="51"
                          r="17"
                          fill="#222126"
                          stroke="#d8dde5"
                          strokeWidth="2"
                        />
                        <circle
                          cx="66"
                          cy="47"
                          r="3"
                          stroke="#d8dde5"
                          strokeWidth="2"
                        />
                        <circle
                          cx="76"
                          cy="47"
                          r="3"
                          stroke="#d8dde5"
                          strokeWidth="2"
                        />
                        <path
                          d="M60 61c1.8-5 10-5 12 0M71 61c1.8-5 9-5 11 0"
                          stroke="#d8dde5"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </Section>
                  </Column>
                  <Column className="w-[344px] align-middle">
                    <Text className="m-0 text-[24px] font-bold leading-[1.2] text-white">
                      Invite &amp; Unlock
                    </Text>
                    <Text className="m-0 max-w-[330px] pt-[16px] text-[16px] leading-[1.55] text-[#d4d4d7]">
                      Invite 5 friends and unlock{" "}
                      <strong className="text-white">
                        7 days of WaspAI Pro
                      </strong>
                      {" -- "}for free.
                    </Text>
                    <Button
                      className="mt-[18px] rounded-[9px] border border-[#8f98a6] bg-[#111113] px-[34px] py-[13px] text-[16px] font-bold text-white"
                      href={inviteUrl}
                    >
                      Invite Now&nbsp;&nbsp;&nbsp; &#8594;
                    </Button>
                  </Column>
                </Row>
              </Section>

              <Section className="pt-[54px]">
                <Hr className="m-0 border-[#24262a]" />
                <Text className="m-0 mt-[-12px] text-[16px] leading-none text-[#e2e8f0]">
                  &#10022;
                </Text>
                <Row className="pt-[24px]">
                  <Column className="w-1/3 text-center">
                    <Text className="m-0 text-[12px] font-semibold uppercase tracking-[2.7px] text-[#bebec0]">
                      One Workspace
                    </Text>
                  </Column>
                  <Column className="w-[18px] text-center">
                    <Text className="m-0 text-[#d8d8d8]">&#8226;</Text>
                  </Column>
                  <Column className="w-1/3 text-center">
                    <Text className="m-0 text-[12px] font-semibold uppercase tracking-[2.7px] text-[#bebec0]">
                      Every AI Model
                    </Text>
                  </Column>
                  <Column className="w-[18px] text-center">
                    <Text className="m-0 text-[#d8d8d8]">&#8226;</Text>
                  </Column>
                  <Column className="w-1/3 text-center">
                    <Text className="m-0 text-[12px] font-semibold uppercase tracking-[2.7px] text-[#bebec0]">
                      Infinite Possibilities
                    </Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            <Section className="rounded-b-[18px] border-t border-[#202226] bg-[#0b0c0e] px-[48px] pb-[38px] pt-[38px]">
              <Row>
                <Column className="align-middle">
                  <Logo muted />
                </Column>
                <Column className="w-[210px] align-middle">
                  <Row>
                    <Column className="text-center">
                      <Link
                        className="inline-block h-[30px] w-[30px] rounded-full border border-[#777] text-center text-[16px] leading-[30px] text-[#cfcfcf] no-underline"
                        href={`${baseUrl}/x`}
                      >
                        X
                      </Link>
                    </Column>
                    <Column className="text-center">
                      <Link
                        className="inline-block h-[30px] w-[30px] rounded-full border border-[#777] text-center text-[16px] font-bold leading-[30px] text-[#cfcfcf] no-underline"
                        href={`${baseUrl}/linkedin`}
                      >
                        in
                      </Link>
                    </Column>
                    <Column className="text-center">
                      <Link
                        className="inline-block h-[30px] w-[30px] rounded-full border border-[#777] text-center text-[17px] leading-[30px] text-[#cfcfcf] no-underline"
                        href={baseUrl}
                      >
                        &#9711;
                      </Link>
                    </Column>
                  </Row>
                </Column>
              </Row>

              <Text className="m-0 pt-[36px] text-center text-[14px] leading-[1.7] text-[#c7c7ca]">
                If you have any questions, we&apos;re here to help.
                <br />
                Reply to this email or visit our{" "}
                <Link
                  href={`${baseUrl}/help`}
                  className="text-[#f1f1f1] underline"
                >
                  help center
                </Link>
                .
              </Text>
              <Hr className="mb-[24px] mt-[28px] border-[#2b2d31]" />
              <Text className="m-0 text-center text-[13px] leading-[1.7] text-[#a8a8ac]">
                &copy; 2024 WaspAI. All rights reserved.
                <br />
                WaspAI Inc.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

WaspAIWelcomeEmail.PreviewProps = {
  userName: "{{user_name}}",
  dashboardUrl: "https://waspai.app/dashboard",
  inviteUrl: "https://waspai.app/dashboard/invite",
} satisfies WelcomeEmailProps;

export async function getWelcomeEmailHtml(userName: string): Promise<string> {
  return await render(React.createElement(WaspAIWelcomeEmail, { userName }));
}
