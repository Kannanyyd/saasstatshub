# 构建防错误发布加固（2026-11-02，停在发布批准前）

> 状态：**本地实现与验证完成；未推送、未触发线上构建、未改 Pages/CMS 配置、未写 CMS、未触碰 Signals/D1**。
> 基线提交 `6b3e587`。隔离工作树 `~/.local/saasstatshub-failsafe-focused-7qn49l53`（= 基线 + 本批补丁），干净检出 `~/.local/saasstatshub-failsafe-clean-8tdarn6z`（clone 自真实仓库、checkout 基线、`git apply` 本批补丁、`npm ci`）。
> 证据目录：`artifacts/build-failsafe-20261102/focused/`（红/绿结果、干净检出清单、正常构建日志与 C04 核验、Pages 配置证据）。

## 1. 本轮关闭的四个聚焦缺口

### 1.1 分页结构校验（缺 `pageInfo` / 缺 `hasNextPage` 不再等同 false）

新增共享校验器 `readPostConnection()`（`src/lib/wp-api.ts`），`getAllArticleSlugs` 与 `getCategoryPageData` 每页都走同一规则：

| 规则 | 行为 |
|---|---|
| `posts`/`category.posts` 不是对象 | 抛错（`connection must be an object`）；首页缺失同样抛错，不再 `break` 当空 |
| `nodes` 不是数组 | 抛错（`nodes must be an array`） |
| `pageInfo` 缺失/非对象 | 抛错（`pageInfo must be an object`） |
| `hasNextPage` 非布尔（缺失、`0`、`"false"`） | 抛错（`hasNextPage must be boolean`） |
| `hasNextPage === false` | **唯一**正常结束条件 |
| `hasNextPage === true` 且 cursor 非字符串/空串/含首尾空白 | 抛错（`endCursor must be a non-blank string`） |
| cursor 重复或成环 | 抛错（`endCursor did not advance`；cursor 按不透明令牌比较，不做字典序假设） |
| 50 页硬上限耗尽 | 仍抛错（原有保护） |

- 合法空分类保留：`category` 存在、`posts` 结构完整、`hasNextPage=false` → 正常返回 0 篇（生产页面渲染 "No articles yet in this category"）。
- 明确 false 但服务器漏数据：仍属外部数据正确性问题，**不猜真实总数**，已在边界中列明。

### 1.2 正文校验（非空白字符串）

`getArticleData`：`post` 为空 → `article not found`；`content` 非字符串、空串、纯空白（空格/换行/制表）→ `article body must be a non-blank string`。合法文章仍可缺 FAQ、要点、来源、概览等可选字段。

### 1.3 非 GraphQL 端点/协议校验

`fetchGraphQL` 在 `response.json()` 之前先校验 `content-type`（仅接受 `application/json` / `application/graphql-response+json`），并对 JSON 解析失败、响应非对象、`errors` 非数组、`data` 非对象分别给出明确错误（`non-GraphQL response` / `invalid GraphQL JSON` / `invalid GraphQL data`）。

对应用户报告的 C04 真实故障：`WP_API_URL` 误设为 CMS 裸域时，旧构建会成功生成约 40 页无文章站点。现在裸域返回 HTML → `[wp-api] non-GraphQL response`，构建非零退出；重定向到非 GraphQL 页面同样失败（测试见 `html-endpoint` / `redirect-to-html`）。

### 1.4 测试可复现与隔离

- **夹具随测试交付**：`scripts/fixtures/build-failsafe.mjs`，纯合成数据（3 篇虚构文章、2 个分类、无凭据、无网络取数、无生产快照），确定性。
- **不依赖本机 artifacts/.env**：每个场景在 `os.tmpdir()` 下新建独立 root，只复制白名单源文件（`src`、`public`、`scripts`、`astro.config.mjs`、`tsconfig.json`、`package.json`、`package-lock.json`），`node_modules` 只做链接；环境只透传 `PATH/HOME/TMPDIR/LANG` 等，显式剔除 `NODE_OPTIONS`、`PREVIEW_DRAFTS`、`FIXTURES_PATH`，`NODE_ENV=production`。
- **不覆盖正常产物**：调用方 `dist/` 只做前后指纹（文件数/字节/SHA-256）比对，不删除、不写入；测试构建全部发生在临时目录。已实测 `Caller dist unchanged: true`。
- **失败判定严格**：同时要求 ①注入确实命中目标操作 ②退出码符合预期（故障必须非零）③日志含该场景专属错误标记 ④`fixtureErrors=0` ⑤未超时/未被信号杀死。任何一条不满足即失败——不会把 500、未处理查询或超时当作"目标场景通过"。
- 运行方式：`npm run test:build-failsafe`（不在 `build` 链上，避免每次部署跑 33 次子构建）。

## 2. 最终代码差异（10 个文件，均未提交）

| 文件 | 变更要点 |
|---|---|
| `src/lib/wp-api.ts` | 协议/JSON/data 校验；`readPostConnection()` 结构+游标校验；两处分页接入；正文非空白校验 |
| `src/pages/[category]/[slug].astro` | 两处 mock 回退限定 `import.meta.env?.DEV`，生产重抛 |
| `src/pages/index.astro` | 生产降级为空 sections（siteConfig 中性回退原样保留） |
| `src/pages/categories/index.astro` | 生产降级为 CATEGORIES 常量 stub |
| `src/pages/categories/[slug].astro` | 两处 catch 生产重抛 |
| `package.json` | `build` 链尾追加 `node scripts/artifact-guard.mjs`；新增 `test:build-failsafe` |
| `scripts/artifact-guard.mjs` | 移除会正常变动的数字断言；新增 C04 附件与 H1 检查、全站 mock 签名扫描、分类/文章/sitemap/rss 完整性；规则维护口径写入头注 |
| `scripts/build-failsafe.mjs`（新增） | 确定性、隔离的生产模式故障/成功矩阵 |
| `scripts/fixtures/build-failsafe.mjs`（新增） | 合成夹具与场景定义 |
| `docs/seo/build-failsafe-hardening-2026-11-02.md` | 本报告 |

完整补丁：`artifacts/build-failsafe-20261102/focused/code-review.patch`（SHA-256 `4c091d25…`）。

## 3. 故障矩阵结果（33/33 PASS）

**成功对照（必须 exit 0）**：`normal-articles-and-empty-category`（正常文章 + 合法空分类 + 无 FAQ/要点/来源字段）、`optional-site-config-error`（可选模块失败仍可构建）。

**故障场景（必须 exit 1 且命中专属标记）**：`http-500`、`http-403`、`html-endpoint`、`redirect-to-html`、`invalid-json`、`missing-data-envelope`、`list-graphql-errors`、`list-empty`、`list-nodes-not-array`、`list-pageinfo-missing`、`list-hasnext-missing`、`list-hasnext-nonboolean`、`list-cursor-missing`、`list-cursor-blank`、`list-cursor-repeated`、`list-cursor-cycle`、`pagination-truncated`、`list-second-pageinfo-missing`、`category-nodes-not-array`、`category-pageinfo-missing`、`category-hasnext-missing`、`category-hasnext-nonboolean`、`category-posts-missing`、`category-cursor-invalid`、`category-cursor-repeated`、`empty-category-metadata-missing`、`post-null`、`content-missing`、`content-whitespace`、`content-nonstring`、`article-error`。

**红灯先行证据**：修复前运行 `normal / list-pageinfo-missing / content-whitespace / html-endpoint`——正常对照通过，另三项 `list-pageinfo-missing` 与 `content-whitespace` **exit 0（缺口真实存在）**，`html-endpoint` 虽非零但报的是 JSON 解析异常而非协议错误。修复后 33/33 通过（`red/`、`green/` 结果与各场景 build.log 已存档）。

## 4. 干净检出复现 + 正常真实 CMS 构建

**干净检出**（`clone --no-checkout` 自真实仓库 → `checkout 6b3e587` → `git apply` 本批补丁；确认 checkout 后工作树为空、无 `artifacts/`、无 `node_modules/`，9 个源文件哈希与隔离工作树逐一相同）：

- `npm ci` 成功；
- `npm run test:phase1`：**147/147**；
- `npm run test:build-failsafe`：**33/33**，`Caller dist unchanged: true`；
- `npm run build`（真实 CMS `https://cms.saasstatshub.com/index.php?graphql`，`NODE_ENV=production`，未设 mock/preview 注入）：**exit 0**，1748 页构建，Pagefind 索引 1695 页，**守卫 23/23 ALL PASS**。

**C04 最新状态核验**（对同一真实构建产物，按 C04 发布报告+最终字段的机读基线逐项）：唯一 H1/`<title>`/meta description/canonical/robots 全部匹配；`.article-body` 规范化文本哈希 = `6f422f62…`（与线上一致）；4 条要点、3 行概览、7 个正文 H2 + `#key-takeaways` 共 8 个 TOC 目标全部可解析、0 重复 id、FAQPage=0；正文内链计数（C01×2、C02×2、C05×1、6 个官方来源各 1）全部匹配；`trial-scorecard.csv` 链接恰 1 次。**C04 BASELINE: ALL PASS（24/24）**。

同一次构建同时验证既有成果：首页中性整改、C01/C02/C05 关键不变量、575 锚点与 FAQ 清理、106/142 批准要点，全部 PASS。

## 5. Cloudflare Pages 接线（已实证）

登录态下只读查看项目 `saasstatshub-git` 部署 `24a0cc5a` 的「构建设置」面板：

| 项 | 实际值 |
|---|---|
| 根目录 (root_dir) | `/` |
| 构建命令 (build_command) | `npm run build` |
| 输出目录 (destination_dir) | `/dist` |
| 构建系统版本 | 3（最新） |
| 环境变量名称 | `MAILERLITE_API_KEY`、`MAILERLITE_GROUP_ID`（值未读取）；**无 `WP_API_URL`** |

结论：Pages 确实执行 `npm run build`，而 `package.json` 已把 `node scripts/artifact-guard.mjs` 串在该命令末尾 → **部署路径必经守卫**；守卫非零退出即构建失败，Pages 保持上一 Active 部署。未修改任何配置，未触发部署。证据：`focused/pages-wiring-verified.json`（脱敏，未记录密钥值）。

## 6. 回滚方案

- **代码**：`git revert <本批提交>` + 重建；或从 `build` 链摘除守卫（不推荐长期）。
- **守卫误拦正常构建**：先判真实回归 vs 规则过时（结构性/批准内容标记/缺席规则三类口径见脚本头注），改规则后重跑；不得为通过而删除缺席规则。
- **测试**：`test:build-failsafe` 不在部署链上，可单独删除其脚本与 fixtures，不影响部署。
- 构建失败期间 Pages 保存上一 Active 部署，无生产影响。

## 7. 边界与遗留

- `hasNextPage=false` 但服务器实际漏数据：不可与完整集合区分，属外部正确性边界，不猜总数。
- 可选模块（RSS/相关文章池/pinned 查询）保持既有空降级；首页 siteConfig 中性默认保留。
- 599 页模板级重复 ID、142 编辑备注句：既有遗留，本批未动。
- 全站守卫中的批准内容标记为"随内容变更同步更新"类别，脚本头注已写明维护方式；刻意不检查文章总数、价格、指引数字、要点条数。
- 本批未提交、未推送、未部署；无 CMS 写入。
