# 维护与贡献

使用 Node.js 24、Git，运行 npm ci --ignore-scripts 安装依赖。

## 添加来源

在 sources.json 增加记录，保持 id、repository 唯一。仓库使用 owner/repo 格式，跟随远端 HEAD 指向的默认分支。

discovery 支持：

- plugin：指定 root，读取原生 manifest，保留各 agent 的技能变体。
- marketplace：指定上游清单，沿用本地插件划分。嵌套外部来源须作为独立来源收录。
- skills：声明 packages；roots 指定技能目录，containers 扫描一层子目录。示例、测试、归档不作为插件发现范围。

resources 声明共享脚本、资源与说明。技能根和许可证自动包含，工作流引用的静态资源必须存在。requirements、cloud、restrictedAgents、operatingSystems 应描述实际限制；未实测的功能不能写成已验证。

## 校验与提交

```sh
npm run sync -- --source <source-id> --publish-dsh
npm run check
git add sources.json
git add catalog dsh docs/CATALOG.md .agents/plugins/marketplace.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json
```

把配置、锁文件及索引一起提交 PR。维护者使用 --publish-dsh 先发行完整资源，再提交引用它的索引。p/ 与 .cache/ 是可恢复缓存，不提交到默认分支；发行器自行保留所有必要资源。不要提交凭证或运行结果。

可选参考文档原本缺失时，由维护者逐条审查，在 resourceExceptions 中记录精确 references/*.md 路径与原因。例外只对不存在的可选文档生效；文件恢复后自动正常分发。脚本缺失、无效元数据、许可证问题不能绕过。

修改封装协议或生成器时增加 src/package.ts 的 ADAPTER_VERSION 并重建，使来源定义与分发版本失效逻辑正确工作。

## 自动发行

Actions 先运行自身测试，再同步来源。同步只读取上游指令，不安装或执行上游脚本。失败来源保留旧版，其他来源继续；任务摘要报告结果。

DSH 包先进入 dist-dsh 的普通历史提交，索引随后引用该提交。发行分支不能 force-push。fork 后先修改 market.config.json 的 repository 与 publisher；发布器拒绝不匹配的 origin。

默认分支若受保护，按项目策略为生成产物的机器人提交设置受限例外，或接入项目自己的自动合并流程。回退时恢复上一有效锁文件和索引并运行 npm run validate；DSH 历史版本继续引用原来的提交。
