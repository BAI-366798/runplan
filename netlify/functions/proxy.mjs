/**
 * 跑步课表 App - AI 代理（Netlify Functions 版）
 * 作用：浏览器 → Netlify 函数 → 智谱 API，解决浏览器直连被 CORS 拦截的问题
 *
 * 部署步骤（全程免费，约 10 分钟）：
 * 1. 把 functions/proxy.mjs 上传到你的 GitHub 仓库 BAI-366798/runplan
 *    （仓库页 → Add file → Upload files → 把整个 functions 文件夹拖进去 → Commit）
 * 2. 打开 https://app.netlify.com → 点「Sign up with GitHub」用 GitHub 账号一键登录并授权
 * 3. Add new site → Import an existing project → Deploy with GitHub → 选 runplan 仓库
 * 4. 部署配置页往下拉，找到 Functions directory，填 functions（其余默认）→ 点 Deploy
 * 5. 等 1 分钟部署完成，得到地址如 https://xxxx-xxxx.netlify.app
 *    建议改个好记的名字：Site configuration → Site details → Change site name → runplan-ai
 * 6. 你的代理地址就是：https://runplan-ai.netlify.app/.netlify/functions/proxy
 * 7. 打开跑步课表 App → 设置 → AI 代理地址 → 粘贴上面整个地址 → 保存
 *
 * 说明：API Key 仍只存在你手机本地；本函数只转发 open.bigmodel.cn，不存储任何数据。
 */

export default async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Max-Age": "86400",
  };

  // 处理浏览器预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: cors });
  }

  // 目标地址通过 ?target= 传入，只允许转发到智谱域名，防止被滥用
  const target = new URL(req.url).searchParams.get("target");
  if (!target || !target.startsWith("https://open.bigmodel.cn/")) {
    return new Response(
      JSON.stringify({ error: { message: "缺少 target 参数或目标地址不在允许范围内" } }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const upstream = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": req.headers.get("Authorization") || "",
      "Accept": "application/json",
    },
    body: await req.text(),
  });

  const res = new Response(upstream.body, upstream);
  for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
  return res;
};
