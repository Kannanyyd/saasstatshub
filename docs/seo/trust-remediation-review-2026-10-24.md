# 首页可信度整改审阅包（A 阶段，2026-10-24，v2 修订稿）

> 状态：**草案完成，未发布**。生产 CMS 未写入、未部署、未发送邮件；代码修改在工作区未提交。
> v2 修订（2026-10-24 深夜，按审阅意见）：①补全来源链路最小方案与兼容顺序（§3），**首发不查询任何未注册字段**；②五卡证据逐张全文引证重核，Statista 降级待证据（§2）；③回滚备份补齐：实际存储核实 + 全部 option key 清单 + 一次性 MySQL 演练字节级还原通过（§7）；④订阅结论限定（§8）。
> 证据：`artifacts/trust-audit/scenarios-v2/`（本轮场景截图与测量）、`~/.local/restore-verify/homepage-options-export-20261024-utf8mb4.sql`（配置备份）、服务器 `/www/backup/database/pre-trustfix-20261024/`。

## 0. 接续门槛核对

- 四页搜索实验已发布（commit 3c51516，deployment c11ec990，2026-10-24）；移动端表格修复已发布（e7bbdbd，deployment 1d3f9982）。D0/D+7/D+28 按各自日期计算，不受本计划影响。
- 工作区保留全部未提交文件与本批无关的历史改动；本任务代码修改精确限定在下表文件。

## 1. 公开声明处置表（A1）

来源三线核对：线上渲染（2026-10-24 抓取）、代码默认（site-config.ts）、CMS ACF options（181 行实读，§7）。**线上展示的是 CMS 值**——只改代码默认不能改变线上，必须同时写回 CMS（§6）。

| # | 声明（位置） | 现状证据 | 处置 | 替换文案 |
|---|---|---|---|---|
| 1 | "Trusted by 50,000+ analysts"（hero 徽标，CMS+默认） | 无任何来源；人数虚构 | **撤换** | `Sourced statistics · Named references` |
| 2 | H1 "The #1 Source for"（CMS+默认） | 排名无法证明 | **撤换** | 三行改为 `Independent` / `SaaS Statistics` / `& Market Data` |
| 3 | 打字机 "Always cited. Always current."（CMS+默认+BaseLayout 硬编码回退） | "Always current" 为绝对承诺；数据更新止于 8 月 | **撤换** | `Explore sourced statistics, platform comparisons, and research guides.` / `Numbers scoped by period, geography, and source.` / `Forecasts are labeled as forecasts — not facts.` |
| 4 | 打字机 "$232B market. 30,000+ companies. 1 source."（同上） | 三数字均未证实（见 §2） | **撤换**（并入上行替换组） | — |
| 5 | 浮动卡 "SAAS · Live"+live-dot+"$232B ▲14.2%"、"CRM 35.2% share"（HeroSection.astro 硬编码） | 装饰图形+"Live"标签被理解为实时数据；数字无来源 | **去数字化** | 标签改 `Sourced research` / `Market data`，数字行改 `Illustration`，移除 live-dot，加 aria-hidden |
| 6 | 订阅 pill "📧 Free Weekly Digest"（CMS+默认） | 无每周发刊能力证据 | **撤换** | `📧 SaaS research updates` |
| 7 | 订阅描述 "delivered to your inbox every week"（CMS+默认） | 同上 | **撤换** | `Get sourced SaaS statistics and research updates by email. No spam, unsubscribe anytime.` |
| 8 | 订阅 "Join 12,000+ SaaS professionals"（CMS+默认） | 订阅总数未核实（MailerLite 后台可查但属个人数据，不引用） | **移除** | `socialProof = ""` + 组件条件渲染（空值不渲染空行） |
| 9 | 页脚/侧栏 Newsletter "Get the latest SaaS stats delivered to your inbox." | 无频率承诺，中性 | **保留** | — |
| 10 | About/Research Desk "primary independent maintainer"（单人维护） | 与实际一致，诚实 | **保留** | — |
| 11 | 编辑政策 "we do not claim to have tested products…" | 诚实，无实测声明 | **保留** | — |
| 12 | 编辑政策 "each statistic is checked against its cited source" | 政策性描述与抽查一致 | **保留** | — |

## 2. 首页数据卡证据与处置表（A2，全文引证重核 2026-10-24）

核验标准（较 v1 收紧）：命名的机构**自己的、可访问的、有日期的**原始页面**全文**支持该数字+范围+期间+预测性质；机构名、检索摘要、二手转述均不构成证据。无法读取完整依据的一律降级或隐藏。

**重核结论：4 张卡证据通过（s1/s4/s5/s7，原文引证如下），1 张降级待证据（s2），3 张维持隐藏（s3/s6/s8）。按 §3 兼容要求，首发 8 张全部隐藏；4 张修正卡在链路（§3）完成后再发布。**

| 卡 | 现展示 | 判定 | 原文引证（逐字）与定位 | 处置 |
|---|---|---|---|---|
| s1 | $232B / Global SaaS Market (2026) / Gartner | **MISMATCH** | Gartner 2024-11-19 新闻稿《Gartner Forecasts Worldwide Public Cloud End-User Spending to Total $723 Billion in 2025》**Table 1**（单位：Millions of USD）行 "Cloud Application Services (SaaS)"：2024 Spending **250,804**（+18.1%）；2025 Spending **299,071**（+19.2%）；表尾 "Source: Gartner (November 2024)"。即 **$299.1B 为 2025 年预测**，全球、公共云 SaaS 终端支出——不是 2026 实绩 | **待阶段二发布**：$299.1B / SaaS end-user spending, 2025 (forecast) / Gartner + 链接 + period "2025 (forecast), worldwide" |
| s2 | 14.2% / CAGR 2024–2030 / Statista | **待证据（v1 结论撤回）** | Statista outlook 公开页标题区可见 11.86%（2026–2031）字样，但完整依据（历史序列、方法论、样本范围）在订阅墙内不可读；检索摘要不作为全文核验。v1 拟替换的 11.86% **同样未达本轮标准** | **降级待证据**：不发布。除非取得可读的官方全文（截取原始表格定位），否则维持隐藏 |
| s3 | 30,000+ / SaaS Companies Worldwide / Crunchbase | **UNVERIFIABLE** | Crunchbase 从不发布 SaaS 公司总数；30,000 出自博客互抄（Exploding Topics/GrowthList，均归"某 Statista 研究"但 Statista 页面无此数） | **隐藏**（无可靠替代，不编造） |
| s4 | 78% / Enterprise Adoption Rate / McKinsey | **MISMATCH** | McKinsey《The state of AI in 2025: Agents, innovation, and transformation》（**November 5, 2025 \| Survey**，即含 88% 的对应报告版本）原文："The share of respondents saying their organizations are using AI in at least one business function has increased since our research last year: **88 percent report regular AI use in at least one business function, compared with 78 percent a year ago.**" 方法注："The online survey was in the field from **June 25 to July 29, 2025**, and garnered responses from **1,993 participants in 105 nations**…"（直抓被 Akamai 拒；经 Wayback 2026-10-06 快照读取官方页原文） | **待阶段二发布**：88% / Organizations using AI in at least one business function / McKinsey + 该报告链接 + period "2025 survey (fielded Jun 25 – Jul 29, n=1,993)" |
| s5 | 94% / Cloud Adoption (Enterprise) / Flexera | **PARTIAL（陈旧）** | 94% 出自 **2019** RightScale/Flexera 报告。Flexera 官方博客 2026-03-18《Flexera 2026 State of the Cloud Report: The Convergence of Cloud and Value》原文："**Hybrid cloud dominates, with 73% of organisations combining public and private cloud environments.**"、"Seventy-three percent of respondents are using hybrid cloud, an increase from last year."、"The 2026 edition is based on a **survey of 753 cloud decision-makers**"。官方博客 2026-03-30 亦载："Hybrid cloud remains the dominant architecture, with **73% of organizations operating hybrid estates, up three percentage points from last year**." | **待阶段二发布**：73% / Organizations running hybrid cloud, 2026 / Flexera + 博客链接 + period "2026 survey, n=753" |
| s6 | 68% / Mobile SaaS Usage / Okta | **UNVERIFIABLE** | Okta Businesses at Work 2021–2024 全文检索无此口径（68% 均为个别应用 YoY 增长）；无二手来源 | **隐藏** |
| s7 | $188B / Cybersecurity Spend / Gartner | **PARTIAL（陈旧）** | Gartner 2025-07-29 新闻稿原文："**Worldwide end-user spending on information security is projected to reach $213 billion in 2025, up from $193 billion in 2024**"（STAMFORD, Conn., July 29, 2025）。$188.3B 是 2022-08 对 2023 的旧预测 | **待阶段二发布**：$213B / Information security spending, 2025 (forecast) / Gartner + 链接 + period "2025 (forecast), worldwide" |
| s8 | 12,400 / AI-powered SaaS Tools / G2 | **UNVERIFIABLE** | 无任何主/二手来源；G2 实际公布 20,000+ AI products（2025 Year in Review） | **隐藏**（如需保留应换 20,000+ 口径，本轮不加） |

**趋势箭头/曲线（A2 第 4 项）**：8 张卡全部 `trend:'up'`，曲线来自 `sparkline-defaults.ts` 硬编码装饰序列。处置：**sparkline 仅在 CMS 提供真实 `sparklineData` 时渲染**（硬编码兜底与装饰曲线链路停用）；修正后的 4 张卡均为单点数字，无曲线、无箭头。

**来源可访问性备注（如实）**：Gartner 两条新闻稿经页面读取器取得官方页全文（站点对普通爬虫 403）；McKinsey 经 Wayback 2026-10-06 快照读取官方页原文（直抓 403）；Flexera 直读官方博客。引用均以官方页在发布日的实际内容为准，URL 长期有效性不承诺。

## 3. 真实来源链路最小方案（修订核心，含兼容发布顺序）

### 3.1 现状差距（已逐项核实）

| 层 | 现状 | 差距 |
|---|---|---|
| ACF 字段组 | 主题 `acf-json/group_site_config.json`：`layout_hot_stats.cards` repeater 仅 7 个子字段（card_id/icon/number/label/source/gradient/enabled，均 `show_in_graphql:1`） | **无 `source_url`/`period`** |
| GraphQL schema | WPGraphQL for ACF 从字段组自动生成卡类型；mu-plugin `site-config-options.php` 只注册 Options Page + `RootQuery.siteConfig` resolver | 字段组不注册则 GraphQL 无此二字段 |
| 前端查询 | `SITE_CONFIG_QUERY`（wp-api.ts）cards 选择集 = 上述 7 字段 | **未选择 sourceUrl/period**——只改 transform 拿不到值 |
| 前端类型 | `RawAcfHomeSection.cards` 现已声明可选 `sourceUrl?/period?`（本轮补，纯类型） | 已补齐 |
| transform | 已透传 `c.sourceUrl`/`c.period` | 已就绪 |
| 组件 | `stat-source` 已支持链接与 period 渲染（HotStatsSection.astro） | 已就绪 |

### 3.2 关键约束：为什么首发**不能**在查询里加这两个字段

WPGraphQL 对**未注册字段的查询会校验失败并拒绝整个请求**（不是忽略该字段）。即：后端没注册时查询 `sourceUrl` → 整个 `siteConfig` 查询报 `Cannot query field` → `getSiteConfig` catch → 全站回退 `defaultSiteConfig` → **CMS 首页配置整体静默失效**。该行为已用真实构建场景验证（§5 S6：脚本后端返回校验错误 → 页面回退默认、零卡、零声明，站点正常渲染）。

因此兼容发布顺序固定为：

1. **第一步（后端，先行，向后兼容）**：更新主题 `acf-json/group_site_config.json`，在 `layout_hot_stats.cards` 的 `sub_fields` 追加两个 text 子字段（与现有 7 个子字段同风格，不写 `graphql_field_name`，沿用 WPGraphQL-ACF 自动命名 `source_url`→`sourceUrl`、`period`→`period`），随后 `wp acf sync`（或 ACF 后台同步）。**此时前端不动**，多余字段无影响（现状 a 态）。
2. **第一步验证（硬门槛）**：用与 `SITE_CONFIG_QUERY` 相同文本 + `sourceUrl period` 两字段对生产 GraphQL 实测（curl），必须 200 且返回字段（值可为 null）——**不通过则不得进行第二步**。
3. **第二步（前端，同 commit 三件事）**：`SITE_CONFIG_QUERY` cards 选择集加 `sourceUrl period`；契约测试 `SITE_CONFIG_QUERY must NOT select sourceUrl/period` 的反向断言翻转为正向；如 GraphQL 实际命名与预期不符，在同 commit 内修正。
4. **回滚顺序（与发布相反）**：先回滚前端 commit，再回滚后端字段（先撤后端会令查询失败，落入 §3.2 的失效态）。

### 3.3 四态兼容矩阵

| 后端已注册 | 前端新查询 | 结果 | 允许部署？ |
|---|---|---|---|
| 否 | 否 | 现状（卡隐藏/中性首页） | ✅（**本轮首发即此态**） |
| 是 | 否 | 正常，新字段闲置 | ✅（第一步完成后） |
| 是 | 是 | 卡片带来源链接+统计期渲染 | ✅（阶段二目标态） |
| 否 | 是 | **整个 siteConfig 查询失败 → 全站回退默认**（站点可渲染，但 CMS 首页配置静默失效） | ❌（契约测试禁止此态发布） |

### 3.4 首发卡片区状态（R4）

**首发 8 张卡全部隐藏**：CMS 写回 8 个 `cards_N_enabled=0`（§7），代码默认 8 卡 `enabled:false`。任何中间态（只发代码、只写 CMS、构建先后交错）都不展示卡片、不展示机构名-only 的卡。4 张修正卡（s1/s4/s5/s7）**等 §3 链路完成后再启用**——启用时的值、链接、period 已在 §2 定稿。渲染路径已用阶段二载荷预览验证（§5 S7：4 卡带来源链接+period 正常渲染）。

## 4. 代码修改前后对照（工作区未提交）

| 文件 | 修改 |
|---|---|
| `src/lib/site-config.ts` | 默认 hero/打字机/订阅文案中性化；8 张默认卡 `enabled:false`+清值；`HotStat` 新增可选 `sourceUrl`/`period`（additive） |
| `src/lib/wp-api.ts` | ①卡片转换透传 `sourceUrl`/`period`（响应无该字段时为 undefined）；②`RawAcfHomeSection.cards` 类型补声明可选 `sourceUrl?/period?`（纯类型，注明"注册前不得查询"，交叉引用审阅包 §3.2）；③`import.meta.env?.WP_API_URL` 可选链 + 导出 `transformSiteConfig`——二者为可测试性预留（当前契约测试按 §9 采用源文本断言，未导入 wp-api.ts；该模块因无扩展名导入与 JSON 导入仍不能被 node --test 直接加载），运行时行为不变 |
| `src/components/sections/HeroSection.astro` | 两张浮动装饰卡去数字化 + 移除 3 处 live-dot + aria-hidden |
| `src/components/sections/HotStatsSection.astro` | 零卡整节不渲染；卡片过滤条件为 `enabled !== false && (number || label)`（无数字无标签的卡也不渲染）；sparkline 仅真实序列渲染；stat-source 支持 sourceUrl 链接与 period |
| `src/components/sections/NewsletterCtaSection.astro` | `socialProof` 空值条件渲染 |
| `src/layouts/BaseLayout.astro` | 打字机硬编码回退（复活旧声明路径）替换为中性短句 |
| `src/lib/site-config-contract.test.mjs`（新增） | 9 项契约测试（§9） |
| `package.json` | test:phase1 追加上述测试文件（1 行） |

## 5. 回退路径验证（7 场景 × 2 轮，真实构建 + 脚本化 CMS + CDP 实测）

方法：astro dev（`WP_API_URL` env 指向各场景）+ 脚本化 GraphQL 服务器（支持错误注入，仅对 siteConfig 查询生效）+ Chrome CDP（390×1200 移动仿真 + 1440×900 桌面），每场景 **2 轮**。**18 个探针** = 11 个文案/装饰探针（覆盖 §1 第 1–8 项的可检索字符串：50,000 / #1 Source / 12,000 / every week / Weekly Digest / Always current / $232B / 30,000 / SAAS·Live / 35.2% / Join 12,000）+ 6 个旧卡数字（14.2% / 78% / 94% / 68% / $188B / 12,400）+ 1 个旧卡标签（Enterprise Adoption Rate）。**探针口径注意**：声明扫描在页面顶部执行，此时折叠下方的卡片处于 `data-count-up` 零值态（该动画滚入视口 40% 才计数到目标值，现网既有行为）；卡号真实值另在滚动触发动画后逐卡采样（cardNumbers）。因此 S1 的探针命中数**低估**实际暴露面——桌面端滚动采样证实 8 张卡的旧数字（含 94%/68%/$188B/12,400）全部真实渲染，实际暴露面约 16/18。

| 场景 | 卡数（移动/桌面，两轮一致） | 旧声明命中 | H1 | 卡号（滚动后采样） | 结论 |
|---|---|---|---|---|---|
| S1 当前生产 CMS + 新代码 | 8 / 8 | **12/18**（50,000、#1 Source、12,000、every week、Weekly Digest、Always current、$232B、30,000、Join 12,000、14.2%、78%、Enterprise Adoption Rate；顶部探针口径，实际暴露面约 16/18——见方法段） | 旧（The #1 Source for） | 8 卡旧数字全部真实渲染（桌面采样：$232B / 14.2% / 30,000+ / 78% / 94% / 68% / $188B / 12,400） | **只改代码不够，CMS 必须同步写回** |
| S2 首发写回后 CMS + 新代码 | 0 / 0 | **0/18** | 中性（Independent） | 无卡 | **首发终态达标** |
| S3 CMS 不可达 | 0 / 0 | 0/18 | 中性 | 无卡 | CMS 故障 → 默认（已中性化）。**注**：回退态的 Latest Articles 走 mock 摘要数据，其中 "$232 billion in 2026"、"14.2% CAGR 2024–2030" 等字样属 B 阶段文章内容范围（§11），不在本批 18 探针口径内 |
| S4 CMS 返回 null 字段 | 0 / 0 | 0/18 | 中性 | 无卡 | 缺字段 → 中性回退，无复活 |
| S5 卡数组为空 | 0 / 0 | 0/18 | 中性 | 无卡 | 整节折叠 |
| S6 后端拒绝查询（未注册字段校验错误注入） | 0 / 0 | 0/18 | 中性 | 无卡 | **阶段二隐患态被兜住**：整个 siteConfig 查询失败 → getSiteConfig 回退 → 页面正常中性渲染，无声明暴露 |
| S7 阶段二载荷预览（4 卡含 sourceUrl/period） | 4 / 4 | 0/18 | 中性 | $299.1B / 88% / 73% / $213B | **阶段二链路渲染路径验证**：4 条来源链接均为官方 URL（§2 定稿值），统计期随链接渲染；此状态**不随首发发布** |

产物：`artifacts/trust-audit/scenarios-v2/<场景>/round{1,2}/`——每轮 4 张截图 + `measurements.json`（18 项声明逐项布尔值、statSources 的 href 与完整文本、cardNumbers、newsletter 残留）。截图文件名对应：`homepage-mobile390.png`（=mobile-top）、`homepage-desktop1440.png`（=desktop-top）、`mobile-cards.png`、`desktop-cards.png`（滚动到卡区、计数动画完成后拍摄）。

可复现性备注：本轮调试中曾发现一处**测量基础设施污染**——前次失败循环残留的脚本化 CMS 进程占用端口并持续应答，导致一轮矩阵中 S4–S7 实际都被喂了 S2 载荷（结果作废）。已加固：脚本启动脚本化服务器后必须探活成功才继续（带端口递增重试），并打印"scripted CMS on :<port> (<场景文件>)"绑定日志；重跑后上表即为有效结果。另：Vite dev 在本机只绑 IPv6 `[::1]`，探测 `127.0.0.1` 会 ECONNREFUSED（脚本已用 `[::1]`）。

## 6. 首发范围与发布顺序

**首发 = §4 代码（中性化+卡隐藏）+ §7 的 16 行 CMS 写回。不含 ACF 字段注册，不含查询变更，不发布任何数据卡。** 阶段二（另行批准）：§3 链路 + 4 卡启用写回。

发布顺序（两个中间态都安全）：
1. CMS 写回 16 行（options 更新**不触发** webhook 构建——线上仍是旧前端，旧前端对 enabled=0 的卡不渲染数字区，无声明暴露）；
2. 前端提交推送 → Pages 构建（注意 webhook/git 构建顺序，最终以 Active 部署 Source commit 为准，必要时 `wp eval "ssh_trigger_cf_rebuild(...);"` 补触发）；
3. 上线验证：桌面+390/430 手机实测（声明扫描 + 卡区隐藏 + 订阅区中性 + 表格无溢出回归）。

## 7. CMS 备份与回滚（已演练，生产未动）

### 7.1 实际存储方式（核实，非假定）

ACF Options Page 的首页配置**不是**单一序列化数组，而是 **181 行独立 `wp_options` 记录**（全部 `autoload=off`）：
- **91 行值行**：`options_homepage_sections`（父行 = 5 个布局键顺序数组 `["hero","hot_stats","latest_articles","browse_categories","newsletter_cta"]`）+ 各区字段行（hero 11、hot_stats 61 含 cards 计数行与 8 卡×7 子行、latest 6、browse 4、newsletter 7）+ `options__homepage_sections_layout_meta`（flexible 布局元数据 `{"disabled":[],"renamed":[]}`，无引用行）；
- **90 行引用行**：`_options_homepage_sections*` = `field_hero_*` / `field_hs_*` / `field_la_*` / `field_bc_*` / `field_nl_*` 字段键映射。

**核实过的事实**：`wp option get options_homepage_sections` 只返回父行 5 键数组，**不包含**任何子字段值——按行导出必须用 SQL 级过滤。另核实无其他 `*site_config*` 命名行。

### 7.2 备份物（含 sha256）

| 物 | 位置 | sha256 |
|---|---|---|
| 181 行配置导出（mysqldump `--where option_name LIKE '%homepage%'`，`--default-character-set=utf8mb4`） | 本地 `~/.local/restore-verify/homepage-options-export-20261024-utf8mb4.sql`；服务器 `/www/backup/database/pre-trustfix-20261024/homepage-options-export-20261024-utf8mb4.sql` | `f7cd3b14670f5acb89cacb7381698c0ed2b0a16d939a054f8810d4f8c2f56de1` |
| 全库 dump（写回前基线） | 服务器 `/www/backup/database/pre-trustfix-20261024/wp_saasstats-pre-trustfix-20261024T235245.sql.gz` | `bcc8a2e5abe7fba36d05a014862f63acfe81bcd1d20ec99fef59a5c4f55b21af` |

**字符集教训（已修正）**：默认字符集导出会把多字节 emoji 打碎成 `?`（第一次导出实测：📧 与 📊📈🚀📱🔐🤖 六个 icon 打碎，☁️ 侥幸保留）；必须 `--default-character-set=utf8mb4` 并在导出后验证 emoji 完整（已验证 📧☁️📊 均在）。

### 7.3 首发写回清单（16 行，原值来自 181 行导出逐行核对）

新增：**无**。删除：**无**。所有 `_options_*` 引用行（90 行）、父行、layout_meta、其余 **75 行值行**（91 值行 − 16 修改行）**均不动**。

| # | option_name | 原值 | 新值 |
|---|---|---|---|
| 1 | `options_homepage_sections_0_headline_line_1` | `The #1 Source for` | `Independent` |
| 2 | `options_homepage_sections_0_trust_badge` | `Trusted by 50,000+ analysts` | `Sourced statistics · Named references` |
| 3 | `options_homepage_sections_0_tagline_phrases_0_phrase` | `Always cited. Always current.` | `Explore sourced statistics, platform comparisons, and research guides.` |
| 4 | `options_homepage_sections_0_tagline_phrases_1_phrase` | `Power your decisions with data.` | `Numbers scoped by period, geography, and source.` |
| 5 | `options_homepage_sections_0_tagline_phrases_2_phrase` | `$232B market. 30,000+ companies. 1 source.` | `Forecasts are labeled as forecasts — not facts.` |
| 6 | `options_homepage_sections_4_pill_text` | `📧 Free Weekly Digest` | `📧 SaaS research updates` |
| 7 | `options_homepage_sections_4_description` | `Get the latest SaaS statistics & insights delivered to your inbox every week. No spam, unsubscribe anytime.` | `Get sourced SaaS statistics and research updates by email. No spam, unsubscribe anytime.` |
| 8 | `options_homepage_sections_4_social_proof` | `Join 12,000+ SaaS professionals` | （空串） |
| 9–16 | `options_homepage_sections_1_cards_{0..7}_enabled` | `1`（×8） | `0`（×8） |

执行方式：`wp option update <name> <value> --format=plaintext`（16 次，精确到行）；写回后 GraphQL 复读核对（方法同四页发布）。

### 7.4 恢复演练（一次性 MySQL 5.7.44 实例，生产未动）

1. 服务器一次性实例（独立 datadir 于 /tmp、socket-only、skip-networking、以 mysql 用户运行）导入全库 dump；
2. 演练库 181 行 vs 生产导出**逐行语义比对（id+值+autoload）＝完全一致**（同时证明导出忠实、且 manual-2026-10-24 基线后首页配置无漂移）；
3. 在演练库模拟首发写回（16 行 UPDATE，8 卡 disabled 实测=8）；
4. `DELETE FROM wp_options WHERE option_name LIKE '%homepage%'` 后重放导出 SQL；
5. 恢复后再次导出比对：**181 行字节级一致（含 option_id、emoji、autoload）**，抽查 trust_badge/cards_enabled=1/pill_text/social_proof 全部还原。

生产恢复步骤（如需）：先 `DELETE ... LIKE '%homepage%'`，再 `mysql wp_saasstats < homepage-options-export-20261024-utf8mb4.sql`，然后手动触发 Pages 重建（options 更新不触发 webhook）。极端兜底：整库 dump（§7.2 第二行）。

## 8. 订阅链路（A3，结论限定）

- `functions/api/subscribe.ts`：MailerLite v2（Pages 环境变量密钥，代码不含凭证）；蜜罐命中静默成功不转发；缺 env 返回 500 明确错误。
- **实测结论（2026-10-24，限定表述）**：无效邮箱→400 ✓；蜜罐→200 静默（不触 MailerLite）✓；一次受控测试（`trust-audit-test-20261024@example.com`）→ **200 subscribed = 仅证明"接口接受请求 + 第三方 MailerLite 接入正常"**。
- **仍未验证（维持未验证标记）**：确认邮件是否发送、double opt-in 是否开启、退订链接是否有效、真实投递是否到达收件箱。**端到端投递验证需要受控真实邮箱**——需用户提供或确认一个测试用真实邮箱（如自有域名下的别名），在取得前不宣称端到端通过；不再用 example.com 类地址做投递验证。
- **测试记录清理路径**：①首选：用户在 MailerLite 后台手动删除 `trust-audit-test-20261024@example.com` 单条记录（我无密钥权限，不读取、不导出真实订阅者）；②或用户明确授权后用 API key 删除该单条（操作仅限该记录）。清理完成前，订阅总数类声明维持"未核实"。

## 9. 测试

- **139/139 主站测试通过**（`npm run test:phase1`，含新增 9 项契约测试）。
- 新增 `src/lib/site-config-contract.test.mjs` 9 项：①查询选择集=后端已注册 7 字段；②**查询不得选择 sourceUrl/period（未注册即全查询失败——防 §3.2 失效态的硬门槛，阶段二同 commit 翻转）**；③`RawAcfHomeSection.cards` 类型已声明可选二字段；④默认 hero 无不可证实声明（禁词表断言：50,000 / #1 Source / 12,000 / 30,000+ / $232B / Trusted by）；⑤默认 8 卡全部 disabled；⑥订阅默认无频率承诺、无订阅数；⑦WP 缺区不复活默认区；⑧清空的 socialProof 保持清空；⑨CMS 卡按原样保留（组件负责过滤 disabled）。查询契约断言基于 `wp-api.ts` 源文本（即真实发出的查询），不靠模拟响应注入字段。
- getSiteConfig 网络/错误回退不在此文件单测（wp-api.ts 依赖 import.meta.env 与 JSON 导入，node --test 不可加载）；由 §5 S3/S6 真实构建场景覆盖。

## 10. 回滚步骤

- **代码**：如已提交 → `git revert <commit>`；未提交阶段 → 仅回滚本批 8 个已跟踪文件（`git checkout -- <文件>`：6 个代码文件 + `package.json` + `wp-api.ts` 等见 §4；注意 `package.json` 必须一并回滚，否则 test:phase1 会引用已删除的测试文件而失败）。新增的未跟踪文件用删除而非 checkout：`rm src/lib/site-config-contract.test.mjs`（`git checkout` 对未跟踪文件无效）。不用 git checkout 整目录，避免覆盖他人未提交工作。
- **CMS**：§7.4 生产恢复步骤（16 行逐行 `wp option update` 回旧值，或 DELETE+导出重放），重建 Pages。
- **阶段二各步回滚顺序**：先前端后后端（§3.2 第 4 条）。

## 11. 未核实项与边界

- s2 Statista 11.86%（2026–2031）——官方全文不可读，**待证据**（§2）。
- 订阅链路确认邮件/double opt-in/退订/真实投递——**未验证**（§8）。
- 4 张修正卡 URL 长期有效性不承诺；Gartner/McKinsey 页面对爬虫有防护，引文获取通道已在 §2 如实标注。
- 首页 Latest Articles 六篇摘要、SaaS Market Size 文章正文数字——B 阶段。
- 全站其他页面同类声明扫描——B 阶段抽样覆盖。
- 范围外：Signals /api/snapshot 500（CF 1101）另行处理；B 阶段与其他文章本批不动。
