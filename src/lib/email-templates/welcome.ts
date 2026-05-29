export function getWelcomeEmailHtml(userName: string): string {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Welcome to WaspAI</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#111;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;margin:0;padding:0;}

/* ── SHELL ── */
.shell{
  width:100%;max-width:660px;
  background:#060606;
  position:relative;overflow:hidden;
  border:0.5px solid rgba(255,255,255,0.055);
  font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;
  margin: 0 auto;
  text-align: left;
}

/* ── SPOTLIGHT CANVAS ── */
.bg{position:absolute;inset:0;pointer-events:none;z-index:0;}

/* ── ALL CONTENT ABOVE BG ── */
.z{position:relative;z-index:2;}

/* ── HEADER ── */
.hdr{
  padding:44px 0 12px;
  text-align:center;
}
.beta-badge{
  display:inline-block;
  padding:4px 14px;
  border:0.5px solid rgba(255,255,255,0.14);
  border-radius:1px;
  font-size:8.5px;font-weight:500;
  letter-spacing:.38em;color:rgba(255,255,255,.45);
  text-transform:uppercase;
  margin-bottom:22px;
}
.logo-row{
  display:flex;align-items:center;justify-content:center;gap:10px;
  padding-bottom:40px;
  border-bottom:0.5px solid rgba(255,255,255,0.04);
}
.logo-txt{
  font-weight:300;font-size:13px;
  letter-spacing:.36em;color:rgba(255,255,255,.83);
  text-transform:uppercase;
}

/* ── HERO ── */
.hero{padding:68px 32px 56px;text-align:center;}
.h1{
  font-weight:200;font-size:40px;
  letter-spacing:.26em;color:#e6e6e4;
  text-transform:uppercase;line-height:1.05;
  margin-bottom:3px;
}
.h2{
  font-weight:400;font-size:38px;
  letter-spacing:.34em;color:rgba(176,176,172,.6);
  text-transform:uppercase;line-height:1.05;
}
.flare-row{
  display:flex;align-items:center;justify-content:center;
  margin:26px auto;width:220px;
}
.fl{flex:1;height:0.5px;background:linear-gradient(to right,transparent,rgba(255,255,255,.1));}
.fr{flex:1;height:0.5px;background:linear-gradient(to left,transparent,rgba(255,255,255,.1));}
.fd{
  width:6px;height:6px;border-radius:50%;margin:0 4px;
  background:radial-gradient(circle,#ffe090 0%,#d4a830 50%,rgba(180,130,20,.2) 80%,transparent 100%);
  box-shadow:0 0 9px 3px rgba(210,165,40,.5),0 0 2px 1px rgba(255,240,160,.8);
}
.hsub{
  font-weight:300;font-size:10.5px;
  letter-spacing:.3em;color:rgba(255,255,255,.33);
  text-transform:uppercase;
}

/* ── BODY TEXT ── */
.body-pad{padding:0 52px 44px;}
.greet{font-size:15px;font-weight:300;color:rgba(255,255,255,.58);line-height:1.9;margin-bottom:16px;}
.greet strong{font-weight:500;color:rgba(255,255,255,.84);}
.para{font-size:11px;font-weight:300;letter-spacing:.03em;line-height:2.1;color:rgba(255,255,255,.33);margin-bottom:0;}

/* ── CAPS TABLE ── */
.caps-outer{margin:26px 0;border:0.5px solid rgba(255,255,255,.055);border-radius:2px;overflow:hidden;}
.cap-row td{
  padding:13px 16px;
  background:#080808;
  border-bottom:0.5px solid rgba(255,255,255,.045);
  border-right:0.5px solid rgba(255,255,255,.045);
  vertical-align:middle;
}
.cap-row td:last-child{border-right:none;}
.cap-row.last td{border-bottom:none;}
.cap-ico{
  display:inline-flex;align-items:center;justify-content:center;
  width:27px;height:27px;border-radius:4px;
  background:rgba(255,255,255,.04);
  border:0.5px solid rgba(255,255,255,.08);
  vertical-align:middle;margin-right:10px;
}
.cap-lbl{
  font-size:9.5px;font-weight:400;
  letter-spacing:.16em;color:rgba(255,255,255,.48);
  text-transform:uppercase;vertical-align:middle;
}
.cap-full{background:rgba(255,255,255,.016)!important;}
.cap-full .cap-lbl{color:rgba(255,255,255,.58);font-size:10px;}
.cap-full .cap-ico{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.11);}

/* ── CTA ── */
@keyframes subtleShimmer{
  0%  {transform:translateX(-100%) skewX(-20deg);}
  100%{transform:translateX(400%) skewX(-20deg);}
}
.cta-wrap{text-align:center;padding:30px 0 14px;}
.cta-btn{
  display:inline-block;
  padding:15px 52px;
  background:linear-gradient(160deg,#2a2a2a 0%,#1c1c1c 40%,#383838 100%);
  color:rgba(240,240,238,0.95)!important;
  font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;
  font-weight:500;font-size:10px;
  letter-spacing:.38em;text-transform:uppercase;
  text-decoration:none;border-radius:1px;
  border:0.5px solid rgba(255,255,255,0.3);
  box-shadow:0 0 32px rgba(255,255,255,0.1),0 4px 20px rgba(0,0,0,0.6);
  mso-padding-alt:0;
  position:relative;
  overflow:hidden;
}
.cta-btn::after{
  content:'';
  position:absolute;
  top:0;left:0;
  width:30%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);
  animation:subtleShimmer 6s ease-in-out infinite;
}
.cta-hint{
  margin-top:11px;font-size:9px;
  letter-spacing:.18em;color:rgba(255,255,255,.17);
  text-transform:uppercase;
}

/* ── REFERRAL STRIP ── */
.ref-strip{
  margin:8px 0 0;
  padding:18px 20px;
  border:0.5px solid rgba(255,255,255,.07);
  border-radius:2px;
  background:rgba(255,255,255,.013);
  text-align:center;
}
.ref-title{
  font-size:10px;font-weight:500;
  letter-spacing:.22em;color:rgba(255,255,255,.55);
  text-transform:uppercase;margin-bottom:5px;
}
.ref-desc{
  font-size:10px;font-weight:300;
  letter-spacing:.06em;line-height:1.8;
  color:rgba(255,255,255,.3);
}
.ref-desc strong{font-weight:500;color:rgba(255,255,255,.52);}

/* ── RULE ── */
.rule{height:0.5px;background:linear-gradient(to right,transparent,rgba(255,255,255,.07) 20%,rgba(255,255,255,.07) 80%,transparent);margin:0 36px;}

/* ── FEATURE CARDS ── */
.feats-wrap{padding:42px 38px 50px;}
.feats-eyebrow{
  font-size:8.5px;font-weight:400;letter-spacing:.42em;
  color:rgba(255,255,255,.18);text-transform:uppercase;
  text-align:center;margin-bottom:20px;
}
.feats-table{width:100%;border-collapse:separate;border-spacing:9px;}
.fcard{
  width:33.33%;
  background:rgba(255,255,255,.018);
  border:0.5px solid rgba(255,255,255,.065);
  border-radius:2px;
  padding:19px 15px;
  vertical-align:top;
  position:relative;
}
.fcard-top{
  width:100%;height:0.5px;
  background:linear-gradient(to right,transparent,rgba(255,255,255,.2),transparent);
  display:block;margin-bottom:15px;
}
.fcard-ico{
  display:block;
  width:29px;height:29px;border-radius:4px;
  background:rgba(255,255,255,.04);
  border:0.5px solid rgba(255,255,255,.08);
  margin-bottom:12px;
  line-height:29px;text-align:center;
}
.fcard-ttl{
  font-size:9px;font-weight:500;
  letter-spacing:.22em;color:rgba(255,255,255,.65);
  text-transform:uppercase;margin-bottom:6px;
  display:block;
}
.fcard-dsc{
  font-size:9.5px;font-weight:300;
  line-height:1.75;color:rgba(255,255,255,.27);
  letter-spacing:.02em;display:block;
}

/* ── FOOTER ── */
.ftr{padding:36px 40px 42px;text-align:center;}
.ftr-tag{
  font-size:9.5px;font-weight:200;
  letter-spacing:.28em;color:rgba(255,255,255,.24);
  text-transform:uppercase;line-height:2;margin-bottom:16px;
}
.ftr-tag strong{font-weight:500;color:rgba(255,255,255,.38);}
.pipe-row{
  display:flex;align-items:center;justify-content:center;
  gap:0;margin-bottom:16px;
}
.pseg{font-size:8.5px;letter-spacing:.2em;color:rgba(255,255,255,.17);text-transform:uppercase;}
.pseg.mid{color:rgba(255,255,255,.25);font-weight:500;}
.pipe{color:rgba(255,255,255,.1);margin:0 14px;font-size:12px;}
.stay{font-size:9px;letter-spacing:.25em;color:rgba(255,255,255,.16);text-transform:uppercase;margin-bottom:16px;}
.micro{font-size:8.5px;letter-spacing:.16em;color:rgba(255,255,255,.12);text-transform:uppercase;}
.micro a{color:rgba(255,255,255,.2);text-decoration:underline;}

@media(max-width:480px){
  .h1{font-size:26px;letter-spacing:.16em;}
  .h2{font-size:24px;letter-spacing:.2em;}
  .body-pad{padding:0 26px 36px;}
  .feats-wrap{padding:36px 22px 42px;}
  .feats-table,.feats-table tbody,.feats-table tr,.fcard{display:block;width:100%!important;}
  .fcard{margin-bottom:9px;}
  .rule{margin:0 22px;}
  .ftr{padding:28px 22px 36px;}
  .pipe-row{flex-wrap:wrap;gap:6px;}
  .pipe{margin:0 6px;}
}
</style>
</head>
<body>
<!-- Bulletproof Center Table Wrapper for Gmail/Outlook compatibility -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#111; width:100% !important; min-width:100% !important; table-layout: fixed; margin:0; padding:28px 0;">
  <tr>
    <td align="center" valign="top" style="background:#111; padding: 0 12px;">

      <!-- Shell table -->
      <table class="shell" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 660px; background:#060606; border: 0.5px solid rgba(255,255,255,0.055); position: relative; overflow: hidden; margin: 0 auto; text-align: left;">
        <tr>
          <td valign="top">

            <!-- SPOTLIGHT SVG BG — polygon cones + dust, same as poster -->
            <svg class="bg" viewBox="0 0 600 1100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="rg1" cx="90%" cy="1%" r="72%">
                  <stop offset="0%" stop-color="#ffffff" stop-opacity="0.075"/>
                  <stop offset="28%" stop-color="#ffffff" stop-opacity="0.03"/>
                  <stop offset="60%" stop-color="#ffffff" stop-opacity="0.007"/>
                  <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="rg2" cx="80%" cy="0%" r="52%">
                  <stop offset="0%" stop-color="#cccccc" stop-opacity="0.06"/>
                  <stop offset="50%" stop-color="#aaaaaa" stop-opacity="0.015"/>
                  <stop offset="100%" stop-color="#aaaaaa" stop-opacity="0"/>
                </radialGradient>
                <filter id="gb" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3"/>
                </filter>
                <filter id="gb2" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5"/>
                </filter>
              </defs>
              <!-- ambient radial glows -->
              <rect width="600" height="1100" fill="url(#rg1)"/>
              <rect width="600" height="1100" fill="url(#rg2)"/>
              <!-- main wide cone -->
              <polygon points="540,-8 600,-8 240,480 180,490" fill="rgba(255,255,255,0.025)" filter="url(#gb)"/>
              <!-- bright narrow core beam -->
              <polygon points="572,-8 600,-8 305,360 285,375" fill="rgba(255,255,255,0.045)" filter="url(#gb2)"/>
              <!-- secondary medium beam -->
              <polygon points="520,-8 600,-8 190,540 150,540" fill="rgba(255,255,255,0.016)" filter="url(#gb)"/>
              <!-- very faint outer sweep -->
              <polygon points="480,-8 600,-8 130,600" fill="rgba(255,255,255,0.009)" filter="url(#gb)"/>
              <!-- edge highlight on right -->
              <polygon points="592,-8 600,-8 600,180" fill="rgba(255,255,255,0.055)" filter="url(#gb2)"/>
              <!-- dust particles in beam zone -->
              <g fill="rgba(255,255,255,0.22)">
                <circle cx="488" cy="48" r="0.8"/><circle cx="512" cy="72" r="0.65"/>
                <circle cx="470" cy="105" r="0.75"/><circle cx="540" cy="38" r="0.5"/>
                <circle cx="457" cy="148" r="0.9"/><circle cx="518" cy="128" r="0.55"/>
                <circle cx="483" cy="186" r="0.6"/><circle cx="545" cy="92" r="0.45"/>
                <circle cx="434" cy="198" r="0.7"/><circle cx="568" cy="62" r="0.5"/>
                <circle cx="502" cy="236" r="0.5"/><circle cx="556" cy="164" r="0.6"/>
                <circle cx="450" cy="262" r="0.45"/><circle cx="522" cy="294" r="0.5"/>
                <circle cx="582" cy="122" r="0.4"/><circle cx="414" cy="304" r="0.6"/>
                <circle cx="546" cy="244" r="0.4"/><circle cx="468" cy="344" r="0.5"/>
                <circle cx="534" cy="354" r="0.35"/><circle cx="490" cy="412" r="0.4"/>
                <circle cx="394" cy="374" r="0.5"/><circle cx="426" cy="432" r="0.35"/>
                <circle cx="563" cy="302" r="0.4"/><circle cx="442" cy="390" r="0.4"/>
                <circle cx="578" cy="196" r="0.35"/><circle cx="406" cy="456" r="0.45"/>
              </g>
            </svg>

            <div class="z">

              <!-- ═══ HEADER ═══ -->
              <div class="hdr">
                <div><span class="beta-badge">Early Access Beta</span></div>
                <div class="logo-row">
                  <svg width="25" height="25" viewBox="0 0 28 28" fill="none" style="display: inline-block; vertical-align: middle;">
                    <path d="M3.5 7.5L9.5 21L14 11.5L18.5 21L24.5 7.5" stroke="rgba(255,255,255,0.86)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="logo-txt" style="vertical-align: middle; display: inline-block; margin-left: 6px;">WaspAI</span>
                </div>
              </div>

              <!-- ═══ HERO ═══ -->
              <div class="hero">
                <div class="h1">Welcome To</div>
                <div class="h2">WaspAI</div>
                <div class="flare-row">
                  <div class="fl"></div>
                  <div class="fd"></div>
                  <div class="fr"></div>
                </div>
                <div class="hsub">Your AI workspace is ready</div>
              </div>

              <!-- ═══ BODY ═══ -->
              <div class="body-pad">

                <p class="greet">Welcome, <strong>${userName}</strong></p>
                <p class="para">
                  Your workspace is now active.<br><br>
                  Create agents, automate workflows, generate websites,<br>
                  build skills, and access 100+ AI models — all from one place.
                </p>

                <!-- CAPABILITY TABLE — table layout, Outlook safe, no CSS grid -->
                <div class="caps-outer">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tbody>
                      <tr class="cap-row">
                        <td width="50%">
                          <span class="cap-ico">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.3" stroke-linecap="round">
                              <circle cx="8" cy="5.5" r="2.5"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
                            </svg>
                          </span>
                          <span class="cap-lbl">AI Agents</span>
                        </td>
                        <td width="50%">
                          <span class="cap-ico">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.3" stroke-linecap="round">
                              <rect x="1" y="3.5" width="4" height="3.5" rx="1"/><rect x="11" y="3.5" width="4" height="3.5" rx="1"/><rect x="6" y="9" width="4" height="3.5" rx="1"/><path d="M5 5.25h6M8 7v2"/>
                            </svg>
                          </span>
                          <span class="cap-lbl">Workflows</span>
                        </td>
                      </tr>
                      <tr class="cap-row">
                        <td>
                          <span class="cap-ico">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.3" stroke-linecap="round">
                              <rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>
                            </svg>
                          </span>
                          <span class="cap-lbl">Website Creation</span>
                        </td>
                        <td>
                          <span class="cap-ico">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.3" stroke-linecap="round">
                              <path d="M2 8h3l2-5 2 10 2-5h3"/>
                            </svg>
                          </span>
                          <span class="cap-lbl">Skill Library</span>
                        </td>
                      </tr>
                      <tr class="cap-row">
                        <td>
                          <span class="cap-ico">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.3" stroke-linecap="round">
                              <rect x="2" y="3" width="12" height="9" rx="1.5"/><circle cx="6" cy="7.5" r="1.5"/><path d="M10 5.5l2.5 2-2.5 2"/>
                            </svg>
                          </span>
                          <span class="cap-lbl">Image Generation</span>
                        </td>
                        <td>
                          <span class="cap-ico">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.3" stroke-linecap="round">
                              <polygon points="5.5,4 13,8 5.5,12"/><rect x="2" y="4" width="2" height="8" rx="0.5"/>
                            </svg>
                          </span>
                          <span class="cap-lbl">Video Generation</span>
                        </td>
                      </tr>
                      <tr class="cap-row last">
                        <td colspan="2" class="cap-full">
                          <span class="cap-ico" style="background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.11);">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="1.3" stroke-linecap="round">
                              <circle cx="8" cy="8" r="5.5"/><path d="M8 4v4l2.5 1.5"/>
                            </svg>
                          </span>
                          <span class="cap-lbl" style="color:rgba(255,255,255,0.6);font-size:10px;">
                            100+ AI Models &nbsp;·&nbsp; GPT &nbsp;·&nbsp; Claude &nbsp;·&nbsp; Gemini &nbsp;·&nbsp; Mistral &amp; more
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- CTA — real anchor link, no JS -->
                <div class="cta-wrap">
                  <div style="display:inline-block;position:relative;">
                    <div style="height:0.5px;background:linear-gradient(to right,transparent,rgba(255,255,255,0.18),transparent);"></div>
                    <a href="https://waspai.ai/dashboard" class="cta-btn">OPEN DASHBOARD</a>
                  </div>
                  <div class="cta-hint">Access your workspace instantly</div>
                </div>

                <!-- REFERRAL STRIP -->
                <div class="ref-strip">
                  <div class="ref-title">Invite &amp; Unlock</div>
                  <div class="ref-desc">
                    Invite <strong>5 friends</strong> and unlock <strong>7 days of WaspAI Pro</strong> — free.<br>
                    Share your personal invite link from the dashboard.
                  </div>
                </div>

              </div>

              <!-- RULE -->
              <div class="rule"></div>

              <!-- ═══ FEATURE CARDS — table layout ═══ -->
              <div class="feats-wrap">
                <div class="feats-eyebrow">What awaits you</div>
                <table class="feats-table" cellpadding="0" cellspacing="9" border="0" width="100%">
                  <tbody>
                    <tr>
                      <td class="fcard">
                        <span class="fcard-top"></span>
                        <span class="fcard-ico">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.3" stroke-linecap="round">
                            <circle cx="8" cy="5.5" r="2.5"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
                          </svg>
                        </span>
                        <span class="fcard-ttl">AI Agents</span>
                        <span class="fcard-dsc">Autonomous agents that reason, plan, and act on complex tasks.</span>
                      </td>
                      <td class="fcard">
                        <span class="fcard-top"></span>
                        <span class="fcard-ico">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.3" stroke-linecap="round">
                            <rect x="1" y="3.5" width="4" height="3.5" rx="1"/><rect x="11" y="3.5" width="4" height="3.5" rx="1"/><rect x="6" y="9" width="4" height="3.5" rx="1"/><path d="M5 5.25h6M8 7v2"/>
                          </svg>
                        </span>
                        <span class="fcard-ttl">Workflows</span>
                        <span class="fcard-dsc">Chain models and tools into pipelines built for real production.</span>
                      </td>
                      <td class="fcard">
                        <span class="fcard-top"></span>
                        <span class="fcard-ico">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.3" stroke-linecap="round">
                            <circle cx="8" cy="8" r="5.5"/><path d="M5.5 8h5M8 5.5v5"/>
                          </svg>
                        </span>
                        <span class="fcard-ttl">100+ Models</span>
                        <span class="fcard-dsc">Every leading model unified. Switch freely, stay in flow.</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- RULE -->
              <div class="rule"></div>

              <!-- ═══ FOOTER ═══ -->
              <div class="ftr">
                <div class="ftr-tag">
                  One Workspace. &nbsp;<strong>Every AI Model.</strong>&nbsp; Infinite Possibilities.
                </div>

                <!-- THREE-COLUMN PIPE ROW — matches poster exactly -->
                <div class="pipe-row">
                  <span class="pseg">One Workspace</span>
                  <span class="pipe">|</span>
                  <span class="pseg mid">Every AI Model</span>
                  <span class="pipe">|</span>
                  <span class="pseg">Infinite Possibilities</span>
                </div>

                <div class="stay">Stay Tuned.</div>

                <div class="micro">
                  © 2026 WaspAI &nbsp;·&nbsp; All rights reserved
                  &nbsp;·&nbsp; <a href="https://waspai.ai/unsubscribe">Unsubscribe</a>
                  &nbsp;·&nbsp; <a href="https://waspai.ai/privacy">Privacy</a>
                </div>
              </div>

            </div><!-- /z -->

          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
  return html;
}
