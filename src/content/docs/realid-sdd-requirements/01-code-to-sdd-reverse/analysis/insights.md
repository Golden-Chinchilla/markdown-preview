# RealID 需求洞察

## 提取方法

按 Code -> SDD skill 的分析器选择规则，本项目命中 `business-requirements`、`technical-architecture`、`api-interface`、`ui`。本文件只记录可从代码中直接看到的洞察，并为最终需求规格提供稳定引用 ID。

## REQ 洞察

### REQ-001 注册邮箱验证码

- description：系统必须能为注册邮箱发送验证码，区分注册场景，并在验证码校验成功后返回可用于注册后续步骤的有效会话。
- category：functional
- priority：critical
- acceptanceCriteria：发送注册验证码时返回 `emailVerificationSessionId`；校验验证码时返回 `emailVerificationValidSessionId`；注册邮箱存在性通过后端 `registrationType` 标识。
- dependencies：安全通道、邮箱服务、Redis 会话。
- dataElements：inputs: `recipient`, `email_type`, `verificationCode`; outputs: `emailVerificationSessionId`, `emailVerificationValidSessionId`, `registrationType`; storage: Redis 验证码会话。
- businessRules：注册邮箱需要执行存在性/注册类型检查。
- constraints：验证码接口依赖加密后的 `decrypt_trans_data`。
- assumptions：验证码有效期由后端字典或邮箱服务控制。
- sources：`real_id_flutter/lib/features/auth/domain/register_flow_service.dart`; `did-server/did-service/src/main/java/com/realid/did/Controller/v1/email/EmailController.java`
- extractionConfidence：high
- unknowns：`验证码长度和最大错误次数未从 Controller 完整确认。`

### REQ-002 注册资料合法性校验

- description：系统必须能在注册上链前校验用户资料、邮箱有效会话、真实姓名、头像、DID 标识和邀请码，并返回注册进度会话与账户 ID。
- category：functional
- priority：critical
- acceptanceCriteria：调用注册 validation 后返回 `userRegistrationProgressSessionId` 与 `accountId`；端侧记录注册步骤日志；失败时返回后端错误码。
- dependencies：邮箱有效会话、账号服务、注册缓存日志。
- dataElements：inputs: `emailVerificationValidSessionId`, `realName`, `avatar`, `didId`, `inviteCode`; outputs: `userRegistrationProgressSessionId`, `accountId`; storage: `TBusRidAccountCacheLog`。
- businessRules：注册上链必须先通过合法性校验。
- constraints：注册资料在安全通道传输。
- assumptions：真实姓名和头像格式限制由服务层实现。
- sources：`real_id_flutter/lib/features/auth/domain/register_flow_service.dart`; `did-server/did-service/src/main/java/com/realid/did/Controller/v1/did/register/DidRegisterController.java`
- extractionConfidence：high
- unknowns：`真实姓名和头像的具体格式规则未在 Controller 可见。`

### REQ-003 注册上链与 DID 文档比对

- description：系统必须能基于链配置构建注册 EIP-712 材料，提交三类签名和 DID 文档 payload，并在链上确认后查询状态、比对 DID 文档，不匹配时请求注册回滚。
- category：security
- priority：critical
- acceptanceCriteria：端侧能加载 action 配置；上链 payload 包含 `dataToSign`, `userSign`, `userDeviceSign`, `userEnhSign`, `didDocPayloadHash`; 后端 `/api/v1/did/register/onchain` 返回请求数据；比对结果通过 `/comparison-result` 上传；比对失败时触发 rollback。
- dependencies：本地密钥、P-256 签名、安全通道、后端 chain service、Gateway 合约、The Graph 或链上 DID 文档查询。
- dataElements：inputs: `userRegistrationProgressSessionId`, `didIdKey`, `didId`, `accountId`, `deviceId`, `publicKeys`, `registerDidDocPayload`; outputs: `requestId`, `txHash`, `status`; storage: 注册 pending 与上链上下文。
- businessRules：注册 actionCode 为 1；已注册 DID 不允许再次注册；nonce 必须匹配链上状态。
- constraints：deadline 过期、nonce 错误、设备签名错误或服务端签名错误均应失败。
- assumptions：DID 文档比对的完整字段集合由 comparer 与索引器共同决定。
- sources：`real_id_flutter/lib/features/auth/domain/register_onchain_payload_builder.dart`; `real_id_flutter/lib/features/auth/domain/register_flow_service.dart`; `realidentitydid-contract/protocol/contracts/gateway/RealIDGateway.sol`; `did-server/did-service/src/main/java/com/realid/did/Controller/v1/did/register/DidRegisterController.java`
- extractionConfidence：high
- unknowns：`注册上链状态查询接口的后端 v1 标准路径未在 Controller 清单中单独出现。`

### REQ-004 登录与登录态复用

- description：系统必须支持设备指纹登录、邮箱登录和本地登录态复用，并在本地身份缺失、设备不一致、重装残留或账户非运行态时阻止自动登录。
- category：functional
- priority：critical
- acceptanceCriteria：设备指纹登录返回 `loginValidSessionId` 和 `accountStatus`；邮箱登录对已注册邮箱创建登录有效会话；本地账户状态不可复用时不直接进入登录态；设备 ID 不一致时返回 device mismatch。
- dependencies：设备指纹、Redis 登录会话、本地安全存储、邮箱验证码。
- dataElements：inputs: `accountId`, `deviceId`, `email`; outputs: `loginValidSessionId`, `accountStatus`; storage: 本地 identity、Redis 登录有效会话。
- businessRules：账户处于密钥更新、注销、失效等非运行态时不能自动登录。
- constraints：重装后残留安全身份需要用户确认，不可静默复用。
- assumptions：账户状态码的完整枚举由后端字典维护。
- sources：`real_id_flutter/lib/features/auth/domain/login_flow_service.dart`; `did-server/did-service/src/main/java/com/realid/did/Controller/v1/auth/LoginController.java`
- extractionConfidence：high
- unknowns：`所有账户状态码与中文状态名映射未在单个文件中完整可见。`

### REQ-005 传输安全通道

- description：系统必须在业务请求前建立传输安全通道，通过客户端公钥包、签名、服务端包、服务端签名和 ECDH 派生 AES-GCM key/IV，并将会话写入 Redis。
- category：security
- priority：critical
- acceptanceCriteria：客户端调用 `/api/v1/security/channel/initiate` 后获得 `serverPublicKeyPacket`, `encryptedNonce`, `responseSignature`, `transSessionId`；客户端校验服务端签名和 nonce；后续业务请求携带 `trans_session_id` 和加密后的 `trans_data`。
- dependencies：OpenSSL、ECIES、ECDSA、AES-GCM、Redis、服务端公私钥配置。
- dataElements：inputs: `clientPublicKeyPacket`, `packetSignature`; outputs: `serverPublicKeyPacket`, `encryptedNonce`, `responseSignature`, `transSessionId`; storage: Redis `sessionKey`。
- businessRules：业务接口使用安全通道中的 `decrypt_trans_data`。
- constraints：公钥和签名需为规范 hex/DER 格式；通道会话有过期时间。
- assumptions：安全通道重协商策略未从代码中完整确认。
- sources：`ios_realid/REALID/Util/SecurityUtil.swift`; `ios_realid/REALID/Api/CustomPlugin.swift`; `did-server/did-service/src/main/java/com/realid/did/Controller/v1/security/SecurityController.java`
- extractionConfidence：high
- unknowns：`服务端返回签名覆盖的确切字段由 SafetyPassageUtils 内部决定。`

### REQ-006 护照升级与 ZKP

- description：系统必须支持已登录用户通过护照证明材料和 ZKP 发起 seed 用户升级，先做 validation，再提交上链，并在链上数据确认后比对 DID 文档。
- category：security
- priority：critical
- acceptanceCriteria：端侧在升级前确认护照明文信息已删除；validation 返回 `userUpdateProgressSessionId`；上链使用 actionCode 2；合约校验 ZK proof、护照算法、issuerPubkeyHash、identifier、nonce、deadline、当前 key set 和用户类型。
- dependencies：护照读取、ZKP provider、ZK proving key、Gateway 合约、PassportProofRouter、用户回滚服务。
- dataElements：inputs: `passportAlgo`, `issuerPubkeyHash`, `identifier`, `passportExpiryYmd`, `issuingState`, `zkProof`, `didAliasKey`; outputs: `upgradeSessionId`, `requestId`, `txHash`; storage: 升级 pending。
- businessRules：护照升级目标 userType 为 seed 用户类型；护照明文信息未确认删除时流程必须停止。
- constraints：ZK proof 为空或验证失败时链上交易失败；升级期间不允许并发密钥轮换。
- assumptions：passport proof 的数据来源和用户交互细节未在流程服务外完整确认。
- sources：`real_id_flutter/lib/features/identity/domain/user_upgrade_flow_service.dart`; `did-server/did-service/src/main/java/com/realid/did/Controller/v1/did/update/DidUpdateController.java`; `realidentitydid-contract/protocol/contracts/gateway/RealIDGateway.sol`; `realidentitydid-contract/protocol/contracts/zk/PassportProofRouter.sol`
- extractionConfidence：high
- unknowns：`护照读取 UI 与 ZKP 生成耗时反馈策略未从单个文件完整确认。`

### REQ-007 用户密钥轮换

- description：系统必须支持用户密钥轮换，生成新用户密钥、增强用户密钥和设备密钥，提交上链并在链上确认后比对 DID 文档。
- category：security
- priority：critical
- acceptanceCriteria：密钥轮换前存在登录会话；如果已有 pending 则恢复上一笔；提交 `/api/v1/did/key/rotate` 后保存 pending；比对结果提交 `/api/v1/did/key/rotate/comparison-result`；合约 actionCode 为 3 并校验旧 key set。
- dependencies：本地安全区、生物识别、KeyRotationRepository、后端密钥轮换服务、Gateway 合约。
- dataElements：inputs: `ridacId`, `loginValidSessionId`, `keyType`, `old*Sign`, `new*PublicKey`; outputs: `requestId`, `txHash`, `status`; storage: key rotation pending。
- businessRules：账户已处于密钥更新中时必须恢复 pending，不应重复发起新轮换。
- constraints：轮换需要当前链上 key set 与本地旧 key set 匹配。
- assumptions：`keyType` 的完整业务枚举未在流程服务中展开。
- sources：`real_id_flutter/lib/features/identity/domain/key_rotation_flow_service.dart`; `did-server/did-service/src/main/java/com/realid/did/Controller/v1/did/key/KeyRotationController.java`; `realidentitydid-contract/protocol/contracts/gateway/RealIDGateway.sol`
- extractionConfidence：high
- unknowns：`密钥轮换服务层的状态码变化细节未在 Controller 中完整可见。`

### REQ-008 设备迁移

- description：系统必须支持新设备生成迁移二维码，旧设备扫码发起迁移，后端解析 TLV 并记录新旧设备、公钥和迁移状态，随后完成上链、状态查询、账号同步和比对上传。
- category：security
- priority：critical
- acceptanceCriteria：新设备二维码包含 `migrationSessionId`, `newDeviceId`, `nonce`, `timestamp`, `deviceModelNew`, `signedValue` 和新公钥；旧设备发起 `/api/v1/device/migration/initiate` 后返回 `migrationSessionId`；状态查询返回 `migrationStatus`, `accountSyncStatus`, `hasLoginValidSessionId` 和 `userInfo`；上链 actionCode 为 5 或 7。
- dependencies：新设备密钥材料、旧设备签名、TLV 解析、Redis、设备迁移服务、Gateway 合约。
- dataElements：inputs: `qrCodeData`, `oldDeviceModel`, `payload`, `oldDeviceSign`, `oldUserSign`; outputs: `migrationSessionId`, `migrationStatus`, `newDeviceLoginValidSessionId`; storage: `TBusRidDeviceMigrationLog`, 本地迁移 draft/pending。
- businessRules：旧设备必须有登录会话；迁移过程中要阻止未完成密钥轮换并恢复 pending。
- constraints：二维码 TLV 为空、迁移会话不存在、账户不存在、签名错误或 nonce 错误均导致失败。
- assumptions：二维码各 TLV tag 的完整规格未在文档之外完整列出。
- sources：`real_id_flutter/lib/features/device/domain/device_migration_flow_service.dart`; `did-server/did-service/src/main/java/com/realid/did/Controller/v1/did/migration/MigrationController.java`; `realidentitydid-contract/protocol/contracts/gateway/RealIDGateway.sol`
- extractionConfidence：high
- unknowns：`设备迁移审批 approvalData 的端侧来源未从当前关键文件完整确认。`

### REQ-009 Real ID 注销

- description：系统必须支持用户注销 Real ID，先校验账户可注销、无 pending 密钥轮换、链上 key set 与本地一致，再生成注销签名并提交上链。
- category：security
- priority：critical
- acceptanceCriteria：只有活动 Real ID 可注销；存在 pending 注销时不得发起新的注销；注销前链上 key set 预检失败时保持运行态；合约 actionCode 为 4 并撤销 DID 文档。
- dependencies：登录会话、账户状态、本地密钥、链上 DID 文档 provider、Gateway 合约。
- dataElements：inputs: `ridacId`, `loginValidSessionId`, `didId`, `didIdKey`, `deviceId`, `userType`, `validTo`, `signedData`; outputs: `requestId`, `txHash`, `accountStatus`; storage: account cancellation pending。
- businessRules：已注销、注销中、非运行态账号不可重复注销。
- constraints：注销需要当前 key set 匹配并由用户/设备签名保护。
- assumptions：注销成功后的服务端数据清理范围未在流程服务中完全展开。
- sources：`real_id_flutter/lib/features/settings/domain/account_cancellation_flow_service.dart`; `realidentitydid-contract/protocol/contracts/gateway/RealIDGateway.sol`; `realidentitydid-contract/protocol/contracts/diddoc/RealIDDidDocWriterV1.sol`
- extractionConfidence：high
- unknowns：`注销接口的 v1 标准 Controller 路径在前端仓库中可见，后端新标准 Controller 未单独定位到。`

### REQ-010 用户回滚/无效化

- description：系统必须能在注册、升级、密钥轮换、设备迁移等链上动作的 DID 文档比对失败时，提交 invalidate 上链并恢复或锁定对应动作状态。
- category：security
- priority：critical
- acceptanceCriteria：存在回滚 pending 时跳过重复提交；回滚上链通过 `/api/v1/did/invalidate/onchain`；状态查询可使用本地 pending 快照；合约只允许无效化 latest undo 中存在的最近一次可回滚动作。
- dependencies：UserRollbackFlowService、pending guard、Gateway undo 数据、DID 文档比对器。
- dataElements：inputs: `accountId`, `didIdKey`, `deviceId`, `sourceActionCode`, `sourceRequestId`, `sourceTxHash`, `reason`; outputs: `requestId`, `txHash`, `invalidatedActionCode`, `status`; storage: user rollback pending。
- businessRules：回滚只针对最近一次可无效化动作；比对成功时不触发回滚。
- constraints：回滚仍需 relayer、nonce、deadline、签名和当前 key set 校验。
- assumptions：服务端如何选择恢复状态由合约 undo 与后端记录共同决定。
- sources：`real_id_flutter/lib/features/user_rollback/domain/user_rollback_flow_service.dart`; `did-server/did-service/src/main/java/com/realid/did/Controller/v1/did/invalidate/DidInvalidateController.java`; `realidentitydid-contract/protocol/contracts/gateway/RealIDGateway.sol`
- extractionConfidence：high
- unknowns：`所有 sourceActionCode 与业务动作名称的配置表未在关键文件中完整可见。`

### REQ-011 社交恢复

- description：系统必须支持通过邮箱验证和社交群组发起身份恢复，组员提交签名消息验证后，恢复发起人确认恢复并执行终端数据核验上链。
- category：functional
- priority：high
- acceptanceCriteria：恢复前检查本机 Real ID 状态；同邮箱本地身份优先建议登录；恢复邮箱验证码发送成功后返回 session；发起恢复返回 `recoverSessionId`；确认恢复返回 `ridacId`, `didId`, `didDoc`；终端数据核验失败时提示用户重启恢复。
- dependencies：邮箱验证、社交群组、消息服务、恢复签名、本地恢复密钥材料、链上验证。
- dataElements：inputs: `email`, `sessionId`, `code`, `deviceId`, `devicePubkey`, `signedData`; outputs: `recoverSessionId`, `groupId`, `ridacId`, `didId`, `didDoc`, `requestId`; storage: social recovery state 与恢复 pending。
- businessRules：本机存在不同邮箱或异常状态 Real ID 时，需要用户确认清理/覆盖本地恢复草稿。
- constraints：恢复确认前必须存在有效 recovery session。
- assumptions：社交群组门限规则未在流程服务中以常量形式完整暴露。
- sources：`real_id_flutter/lib/features/social/domain/social_recovery_flow_service.dart`; `did-server/did-service/src/main/java/com/realid/did/Controller/v1/social/SocialV1Controller.java`
- extractionConfidence：high
- unknowns：`组员门限人数和签名聚合规则需进一步从 service 层确认。`

### REQ-012 实时核身

- description：系统必须支持好友之间发起实时核身，生成服务端验证码和消息记录，被核身方提交服务端验证码与 App 验证码完成确认。
- category：functional
- priority：high
- acceptanceCriteria：发起核身返回 `serialNumber` 和 `serverVerifyCode`；被核身方确认时，若 server/app 验证码不一致则标记失败并返回错误；成功时返回 `verifyStatus = 00`；发起方可分页查询核身记录。
- dependencies：好友关系、消息服务、Redis session、端侧签名。
- dataElements：inputs: `didId`, `appVerifyCode`, `serialNumber`, `serverVerifyCode`; outputs: `serialNumber`, `verifyStatus`, `rows`; storage: `TBusRidScGroupUpdateMsgList`。
- businessRules：只能对已建立好友关系的 DID 发起实时核身。
- constraints：已处理或状态非待验证的消息不可重复确认。
- assumptions：验证码展示与用户确认 UI 未在流程服务中完整描述。
- sources：`real_id_flutter/lib/features/social/domain/realtime_identity_flow_service.dart`; `did-server/did-service/src/main/java/com/realid/did/Controller/v1/social/SocialV1Controller.java`
- extractionConfidence：high
- unknowns：`实时核身消息的超时时长来自字典，具体值未在代码片段中确认。`

### REQ-013 社交关系与群组

- description：系统必须支持二维码校验、添加社交链接、好友列表、备注更新、群组创建/确认、群组列表、群组更新/确认和记录查询。
- category：functional
- priority：medium
- acceptanceCriteria：后端提供 `/api/v1/social/qrcode/verify`, `/link/add`, `/friend/list`, `/friend/notes/update`, `/group/create/launch`, `/group/create/confirm`, `/group/list`, `/group/update/launch`, `/group/update/confirm`, `/group/record/query`。
- dependencies：社交关系服务、群组服务、消息服务。
- dataElements：inputs: `accountId`, `didId`, `groupId`, `groupType`, `groupName`; outputs: 好友、群组、记录列表; storage: social group/friend tables。
- businessRules：群组记录查询要求当前账户拥有权限。
- constraints：非群主不能查看或操作对应群组记录。
- assumptions：群组创建/更新中成员签名细节需从 service 层补充。
- sources：`did-server/did-service/src/main/java/com/realid/did/Controller/v1/social/SocialV1Controller.java`; `ios_realid/REALID/Main/Group/*`; `real_id_flutter/lib/pages/connection/connection_page.dart`
- extractionConfidence：medium
- unknowns：`Flutter 社交群组新页面覆盖程度未完整确认。`, `成员签名协议细节未在 Controller 中完整可见。`

### REQ-014 消息中心

- description：系统必须提供消息列表、消息验签/验证、未读状态、新消息状态和已读状态更新，支撑社交恢复、群组和实时核身工作流。
- category：functional
- priority：medium
- acceptanceCriteria：后端提供 `/api/v1/message/list`, `/verify`, `/unread/status`, `/new/status`, `/read-state/update`；消息列表能按会话和分页查询；验证接口能更新消息状态。
- dependencies：消息服务、社交流程、登录会话。
- dataElements：inputs: `session`, `ridacId`, `msgId`, `pageNum`, `pageSize`; outputs: message rows, status; storage: social group update message table。
- businessRules：业务流程中的签名确认应落入消息记录。
- constraints：消息验证需依赖有效会话和业务状态。
- assumptions：消息类型枚举未在 Controller 中完整说明。
- sources：`did-server/did-service/src/main/java/com/realid/did/Controller/v1/message/MessageV1Controller.java`; `real_id_flutter/lib/features/social/domain/social_recovery_flow_service.dart`; `real_id_flutter/lib/features/social/domain/realtime_identity_flow_service.dart`
- extractionConfidence：medium
- unknowns：`消息类型与流程之间的完整映射需从 domain/service 表结构补充。`

### REQ-015 链上 DID 生命周期状态机

- description：系统必须在链上维护 DID 注册、护照更新、密钥轮换、注销、设备迁移、迁移审批和无效化的统一状态机，并把 DID 文档写入 Registry 事件源。
- category：security
- priority：critical
- acceptanceCriteria：Gateway 仅允许授权 relayer 执行业务动作；每个动作校验 `authVersion`, `actionCode`, `nonce`, `deadline`, 签名和当前状态；状态合约更新 nonce、registered、alias、key set hash、didStatus；Registry 发出属性变更事件。
- dependencies：RealIDGateway、RealIDGatewayState、RealIDRegistry、RealIDDidDocWriterV1、AccessControl。
- dataElements：inputs: DID payload、签名、receipt、nonce、deadline; outputs: `RealIDActionExecuted`, `RealIDActionInvalidated`, Registry events; storage: Gateway state 与 Registry event log。
- businessRules：actionCode 1 注册、2 更新、3 轮换、4 注销、5 设备迁移、6 无效化、7 迁移审批。
- constraints：未注册 DID 不可更新/轮换/注销/迁移；已注册 DID 不可重复注册；alias 已绑定时不可重复绑定。
- assumptions：链下服务如何映射事件到业务状态由 indexer 和后端共同实现。
- sources：`realidentitydid-contract/protocol/contracts/gateway/RealIDGateway.sol`; `realidentitydid-contract/protocol/contracts/state/RealIDGatewayState.sol`; `realidentitydid-contract/protocol/contracts/registry/RealIDRegistry.sol`; `realidentitydid-contract/protocol/contracts/diddoc/RealIDDidDocWriterV1.sol`
- extractionConfidence：high
- unknowns：`生产网络的实际合约地址需从部署配置确认。`

### REQ-016 ZK proving key 与护照证明路由

- description：系统必须支持按护照算法查询 proving key 并在链上通过算法路由选择对应 Groth16 verifier 校验证明。
- category：security
- priority：high
- acceptanceCriteria：后端提供 `/api/v1/zk/proving-key/query`；链上 router 可由 owner 设置 verifier；verifyProof 将 proof 拆分为 pA/pB/pC，并以 `issuerPubkeyHash` 和 `identifier` 作为公开信号。
- dependencies：ZkProvingKeyController、PassportProofRouter、Groth16 verifier。
- dataElements：inputs: `passportAlgo`, `issuerPubkeyHash`, `identifier`, `zkProof`; outputs: proof valid/invalid; storage: proving key table 与 verifier mapping。
- businessRules：issuerPubkeyHash 和 identifier 必须小于 BN254 标量域。
- constraints：没有配置 verifier 或 proof 长度不符合预期时验证失败。
- assumptions：proof 字节长度规范由合约解析逻辑决定，未在需求中展开。
- sources：`did-server/did-service/src/main/java/com/realid/did/Controller/v1/zk/ZkProvingKeyController.java`; `realidentitydid-contract/protocol/contracts/zk/PassportProofRouter.sol`; `realidentitydid-contract/protocol/contracts/gateway/RealIDGateway.sol`
- extractionConfidence：high
- unknowns：`proving key 文件分发方式和缓存策略未从 Controller 中确认。`

### REQ-017 端侧密钥与生物识别保护

- description：系统必须在端侧生成、保存和使用用户密钥、增强用户密钥、设备密钥和安全区 P-256 密钥，并在敏感签名场景支持生物识别会话。
- category：security
- priority：critical
- acceptanceCriteria：Flutter 可调用原生生成 Ed25519 key pair、P-256 secure enclave key、获取公钥、签名、批量签名、DER 转 R/S、删除密钥；签名失败应返回错误而不是继续流程。
- dependencies：Flutter MethodChannel、iOS Keychain/Secure Enclave、CryptoService、RegistrationCryptoBridge。
- dataElements：inputs: `tag`, `message`, `digest`, `reason`; outputs: `publicKey`, `signature`, `rsSignature`; storage: Keychain/Secure Enclave。
- businessRules：注册、轮换、注销、迁移等敏感动作必须使用当前 active key tags。
- constraints：批量签名 tags 与 messages 数量必须一致。
- assumptions：Android 原生实现未在当前 iOS 代码域中分析。
- sources：`real_id_flutter/lib/services/crypto_service.dart`; `real_id_flutter/lib/core/security/registration_onchain_signer.dart`; `ios_realid/REALID/Api/CustomPlugin.swift`
- extractionConfidence：high
- unknowns：`Android 端同名 MethodChannel 的实现未在当前读取范围内确认。`

### REQ-018 匿名证明与身份承诺

- description：系统必须通过原生 Rust SDK FFI 生成用户密钥对、EdDSA 签名、身份承诺和匿名群组授权证明，以支撑匿名/社交类证明能力。
- category：security
- priority：medium
- acceptanceCriteria：FFI 返回 JSON 字符串，`code=0` 表示成功；匿名授权证明输入包含群组成员身份承诺、私钥、消息、scope 和 Merkle tree depth；调用方负责释放 FFI 返回字符串。
- dependencies：Rust SDK、FFI、iOS 原生桥接。
- dataElements：inputs: `group_members_json`, `private_key`, `message`, `scope`, `merkle_tree_depth`; outputs: key pair, signature, identity commitment, proof; storage: 调用方管理。
- businessRules：生成 proof 的成员列表必须包含当前身份。
- constraints：证明生成耗时，建议后台线程执行。
- assumptions：Flutter 页面中使用这些 FFI 能力的具体场景需继续追踪。
- sources：`ios_realid/REALID/Lib/realid_rs_sdk.h`
- extractionConfidence：high
- unknowns：`FFI 返回 JSON 的完整 schema 未由头文件完全展开。`

### REQ-019 UI 首次体验与主导航

- description：系统必须提供启动页、登录/注册页、验证码页、资料设置页、首页、连接页、通知页、设置页和个人资料相关页面，支撑端到端 Real ID 使用。
- category：functional
- priority：high
- acceptanceCriteria：Flutter route 包含 splash、login/register、verification code、set profile、main/home/connection/notice/settings；iOS 原生包含 Start/Login/Home/friend/Message/Setting/User 等页面。
- dependencies：Flutter Router、iOS ViewController、用户管理器。
- dataElements：inputs: 用户点击、表单输入、验证码、头像; outputs: 页面状态和导航; storage: 本地用户数据。
- businessRules：生命周期异常时应通过 guarded page 阻止进入受保护页面。
- constraints：具体文案和布局需以页面代码和资产为准。
- assumptions：Flutter 与 iOS 原生页面是否同时面向同一发行版本需项目确认。
- sources：`real_id_flutter/lib/routes/app_router.dart`; `real_id_flutter/lib/pages/*`; `ios_realid/REALID/Main/*`
- extractionConfidence：medium
- unknowns：`当前发行渠道到底使用 Flutter 页面还是 iOS 原生页面为主未从代码结构确认。`

### REQ-020 生命周期 pending 恢复

- description：系统必须在升级、密钥轮换、设备迁移、注销、社交恢复和回滚等链上/跨设备流程中保存 pending 状态，并在用户重进应用或再次发起时优先恢复未完成流程。
- category：functional
- priority：critical
- acceptanceCriteria：流程开始后保存本地 pending；再次运行时检测 pending 并进入恢复；完成或失败后清理或更新 pending；互斥流程开始前检查密钥轮换 pending。
- dependencies：本地 Hive/UserManager store、各 FlowService、PendingKeyRotationGuard、后端状态查询。
- dataElements：inputs: pending snapshot, requestId, txHash, did document; outputs: resumed result; storage: 本地 auth/user boxes。
- businessRules：已有同类 pending 时跳过重复提交；互斥流程不得并发执行。
- constraints：pending 数据缺关键字段时只能提示失败或要求重新开始。
- assumptions：所有 pending 的最大保留时长未在流程服务中统一定义。
- sources：`real_id_flutter/lib/features/auth/data/login_session_store.dart`; `real_id_flutter/lib/features/identity/domain/key_rotation_flow_service.dart`; `real_id_flutter/lib/features/device/domain/device_migration_flow_service.dart`; `real_id_flutter/lib/features/settings/domain/account_cancellation_flow_service.dart`; `real_id_flutter/lib/features/user_rollback/domain/user_rollback_flow_service.dart`
- extractionConfidence：high
- unknowns：`pending 清理策略在不同流程间是否有统一产品规则未确认。`

## ARCH 洞察

### ARCH-001 安全通道包裹业务 API

- description：业务接口的明文参数由客户端插件加入公共参数、排序签名并 AES-GCM 加密成 `trans_data`，服务端通过安全通道会话解密成 `decrypt_trans_data` 后进入 Controller。
- technicalDecisions：rationale: 降低业务参数在传输层外暴露的风险；alternatives: 仅依赖 TLS；tradeoffs: 增加会话协商和调试复杂度；constraints: trans session 过期后业务请求不可用。
- dependencies：`SecurityPlugin`, `SecurityUtil`, `SecurityController`, `FileterUtil`。
- risks：签名排序规则不一致会造成请求失败。
- assumptions：服务端解密 filter 未在本次完整展开。
- sources：`ios_realid/REALID/Api/CustomPlugin.swift`; `did-server/did-service/src/main/java/com/realid/did/Controller/v1/security/SecurityController.java`

### ARCH-002 FlowService 编排端侧长流程

- description：Flutter 将注册、登录、升级、轮换、迁移、注销、恢复、回滚等长流程集中在 domain FlowService 中编排，Repository 负责 API，LocalStore 负责 pending 和本地状态。
- technicalDecisions：rationale: 将页面交互与业务步骤拆开；alternatives: 页面直接调用 API；tradeoffs: 流程服务依赖较多；constraints: pending store schema 需要保持兼容。
- dependencies：各 `FlowService`, Repository, LocalStore。
- risks：流程服务和后端状态机不一致会导致恢复路径异常。
- assumptions：所有页面是否都使用新 FlowService 需继续检查。
- sources：`real_id_flutter/lib/features/*/domain/*flow_service.dart`

### ARCH-003 Receipt 驱动的链上 DID 状态机

- description：Gateway 通过统一 receipt 结构校验 relayer、用户设备签名、服务端签名、nonce、deadline 和 actionCode，再更新 State 与 Registry。
- technicalDecisions：rationale: 把链下业务审批和链上状态变更绑定；alternatives: 用户直接链上调用；tradeoffs: 依赖授权 relayer 和 server signer；constraints: receipt 字段和 EIP-712 domain 必须与端侧一致。
- dependencies：`RealIDEIP712`, `RealIDSignatures`, `RealIDGatewayState`, `RealIDRegistry`。
- risks：链下/链上 actionCode 或 payload hash 不一致会造成交易失败。
- assumptions：server signer 轮换策略需从部署/管理文档确认。
- sources：`realidentitydid-contract/protocol/contracts/gateway/RealIDGateway.sol`

### ARCH-004 Registry 事件源与 State 查询分离

- description：Registry 负责 DID 文档事件，State 负责当前注册状态、nonce、alias 和 key set hash，Gateway 同步写两者。
- technicalDecisions：rationale: 兼顾 DID 文档事件解析和快速状态校验；alternatives: 单合约承载全部数据；tradeoffs: Gateway 必须确保 Registry/State 地址配置正确；constraints: 只有 Gateway 可写业务状态。
- dependencies：`RealIDRegistry`, `RealIDGatewayState`, `RealIDDidDocWriterV1`。
- risks：Registry 与 State 指向不同 Gateway 时会破坏一致性。
- assumptions：索引器延迟处理策略需从 subgraph 配置与后端状态查询补充。
- sources：`realidentitydid-contract/protocol/contracts/registry/RealIDRegistry.sol`; `realidentitydid-contract/protocol/contracts/state/RealIDGatewayState.sol`; `realidentitydid-contract/protocol/contracts/diddoc/RealIDDidDocWriterV1.sol`

## API 洞察

### API-001 认证与安全通道 API

- description：安全通道与登录接口组成认证入口。
- signature：`POST /api/v1/security/channel/initiate`; `POST /api/v1/email/send`; `POST /api/v1/email/verify`; `POST /api/v1/auth/login/fingerprint`; `POST /api/v1/auth/login/email`
- parameters：`clientPublicKeyPacket`, `packetSignature`, `recipient`, `email_type`, `verificationCode`, `accountId`, `deviceId`
- returnValue：安全通道返回 `transSessionId`; 登录返回 `loginValidSessionId`, `accountStatus`。
- constraints：业务登录接口依赖安全通道加密后的请求体。
- errorHandling：邮箱不存在、邮箱账户不匹配、验证码无效、通道协商失败返回业务错误码。
- sources：`SecurityController.java`, `EmailController.java`, `LoginController.java`

### API-002 DID 生命周期 API

- description：DID 注册、配置、更新、密钥轮换、迁移、注销和回滚接口。
- signature：`/api/v1/did/register/*`; `/api/v1/did/config/*`; `/api/v1/did/update/*`; `/api/v1/did/key/*`; `/api/v1/device/migration/*`; `/api/v1/did/invalidate/*`
- parameters：`userRegistrationProgressSessionId`, `loginValidSessionId`, `didIdKey`, `didId`, `dataToSign`, `signature`, `requestId`, `txHash`, `compareResult`
- returnValue：进度 session、requestId、txHash、状态、用户信息。
- constraints：多数接口需要 `decrypt_trans_data`、签名字段和登录有效会话。
- errorHandling：账户不存在、迁移 session 无效、未知异常、链上响应失败。
- sources：`DidRegisterController.java`, `DidUpdateController.java`, `KeyRotationController.java`, `MigrationController.java`, `DidInvalidateController.java`

### API-003 社交与消息 API

- description：社交关系、群组、恢复、实时核身和消息中心接口。
- signature：`/api/v1/social/*`; `/api/v1/message/*`
- parameters：`groupId`, `didId`, `serialNumber`, `serverVerifyCode`, `appVerifyCode`, `msgId`, `pageNum`, `pageSize`
- returnValue：好友列表、群组记录、恢复 session、核身 serialNumber、消息状态。
- constraints：部分接口要求当前账户是群主或好友关系存在。
- errorHandling：群组不存在、无权限、消息不存在、验证码不一致、恢复 session 无效。
- sources：`SocialV1Controller.java`, `MessageV1Controller.java`

## UI 洞察

### UI-001 Flutter 页面与路由

- visualDescription：Flutter 提供 splash、登录注册、验证码、资料设置、首页、连接、通知、设置、设备迁移、用户升级、密钥轮换、社交恢复、实时核身、注销等页面。
- layoutBehavior：页面通过 `app_router.dart` 和功能模块 page 组织。
- contentRequirements：用户在不同生命周期状态下进入对应页面或受保护页面。
- accessibilityInfo：未从读取文件中确认完整辅助功能标注。
- sources：`real_id_flutter/lib/routes/app_router.dart`; `real_id_flutter/lib/pages/*`; `real_id_flutter/lib/features/*/presentation/pages/*`

### UI-002 iOS 原生页面

- visualDescription：iOS 原生代码包含 Start/Login/Home/Group/friend/Message/Setting/User 等 ViewController，覆盖 Real ID 首次体验、社交关系、群组、消息、设置和迁移升级。
- layoutBehavior：UIKit ViewController + Moya/RxSwift 流程。
- contentRequirements：与 Flutter 前端存在功能重叠，需要确认目标版本入口。
- accessibilityInfo：未从读取文件中确认完整辅助功能标注。
- sources：`ios_realid/REALID/Main/*`

