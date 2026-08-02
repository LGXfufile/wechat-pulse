import { fetchJson, json, readBody, requirePost } from "./_shared.js";
import { toWechatHtml } from "../src/format.js";

async function token() {
  const appid = process.env.WECHAT_APP_ID,
    secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret)
    throw Object.assign(new Error("尚未配置微信公众号 AppID/AppSecret"), {
      code: "MISSING_WECHAT_CONFIG",
    });
  const data = await fetchJson(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}`,
  );
  if (!data.access_token)
    throw new Error(data.errmsg || "无法获取微信 access_token");
  return data.access_token;
}

async function uploadCover(accessToken, coverUrl) {
  const source = await fetch(
    coverUrl ||
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=85",
  );
  if (!source.ok) throw new Error("无法获取封面图片");
  const bytes = await source.arrayBuffer();
  if (bytes.byteLength > 10 * 1024 * 1024)
    throw new Error("封面图片不能超过 10MB");
  const form = new FormData();
  form.append(
    "media",
    new Blob([bytes], {
      type: source.headers.get("content-type") || "image/jpeg",
    }),
    "cover.jpg",
  );
  const response = await fetch(
    `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`,
    { method: "POST", body: form },
  );
  const data = await response.json();
  if (!data.media_id) throw new Error(data.errmsg || "上传微信封面素材失败");
  return data.media_id;
}

async function uploadContentImage(accessToken, illustration) {
  const match = illustration.dataUrl?.match(/^data:image\/(png|jpeg);base64,(.+)$/);
  if (!match) throw new Error(`配图“${illustration.headline || illustration.id}”格式无效`);
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("单张文章配图不能超过 10MB");
  const extension = match[1] === "png" ? "png" : "jpg";
  const form = new FormData();
  form.append("media", new Blob([bytes], { type: `image/${match[1]}` }), `${illustration.id}.${extension}`);
  const response = await fetch(
    `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`,
    { method: "POST", body: form },
  );
  const data = await response.json();
  if (!data.url) throw new Error(data.errmsg || "上传微信正文配图失败");
  return { ...illustration, dataUrl: undefined, url: data.url };
}

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;
  const body = await readBody(req);
  if (!body.title || !body.content)
    return json(res, 400, { error: "标题和正文不能为空" });
  try {
    const accessToken = await token();
    const thumbMediaId =
      body.thumbMediaId || (await uploadCover(accessToken, body.coverUrl));
    const uploadedIllustrations = await Promise.all(
      (body.illustrations || []).slice(0, 5).map((item) => uploadContentImage(accessToken, item)),
    );
    const draft = await fetchJson(
      `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles: [
            {
              title: body.title.slice(0, 64),
              author: body.author || "",
              digest: (body.digest || "").slice(0, 120),
              content: toWechatHtml(body.content, body.template, uploadedIllustrations),
              content_source_url: body.sourceUrl || "",
              thumb_media_id: thumbMediaId,
              need_open_comment: 1,
              only_fans_can_comment: 0,
            },
          ],
        }),
      },
    );
    if (!draft.media_id) throw new Error(draft.errmsg || "保存草稿失败");
    if (body.action !== "publish")
      return json(res, 200, { status: "draft", mediaId: draft.media_id });
    const publish = await fetchJson(
      `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_id: draft.media_id }),
      },
    );
    if (!publish.publish_id) throw new Error(publish.errmsg || "提交发布失败");
    json(res, 200, {
      status: "submitted",
      mediaId: draft.media_id,
      publishId: publish.publish_id,
    });
  } catch (error) {
    json(res, error.code === "MISSING_WECHAT_CONFIG" ? 503 : 502, {
      error: error.message,
      code: error.code,
    });
  }
}
