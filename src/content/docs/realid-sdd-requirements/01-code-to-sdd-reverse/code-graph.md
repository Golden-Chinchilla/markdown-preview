# RealID 代码图谱

## 分析范围

本次图谱按项目根目录下四个代码域拆分：Flutter 前端、iOS 原生、Java 后端、Solidity 合约。跳过 Pods、lockfile、生成产物和纯配置，仅记录与业务需求相关的入口、流程编排、接口边界和链上状态机。

## Flutter 前端 `real_id_flutter/`

| 文件 | 摘要 | 关键定义 | 依赖 |
| --- | --- | --- | --- |
| `lib/features/auth/domain/register_flow_service.dart` | 注册流程编排，负责发送/校验邮箱验证码、注册合法性校验、加载上链配置、提交注册上链、查询上链状态和回滚已确认注册。 | `RegisterFlowService`, `RegisterProfileInput` | `AuthRepository`, `LoginApiEndpoint`, `RegisterOnchainPayload` |
| `lib/features/auth/domain/login_flow_service.dart` | 闪屏设备指纹登录和登录态复用逻辑，处理本地身份缺失、重装残留、设备不一致、账户非运行态和邮箱登录兜底。 | `LoginFlowService`, `LoginDeviceIdProvider` | `LoginSessionStore`, `NetManager`, `AuthRepository` |
| `lib/features/auth/domain/register_onchain_payload_builder.dart` | 注册上链 EIP-712 材料组装，生成 DID 文档 payload、digest、dataToSign 和三类签名载荷。 | `RegisterOnchainPayloadBuilder`, `RegistrationOnchainMaterial` | `RegisterEip712Util`, `RegistrationOnchainSigner` |
| `lib/core/security/registration_onchain_signer.dart` | 注册、更新、迁移、注销等流程的本地密钥桥接，抽象 Ed25519、P-256、安全区和生物识别会话。 | `RegistrationCryptoBridge`, `RegistrationCryptoKeyTags` | `CryptoService`, `RegisterEip712Util` |
| `lib/features/identity/domain/user_upgrade_flow_service.dart` | 护照升级为 seed 用户的流程编排，包含 pending 恢复、护照证明读取、ZKP 构建、validation、onchain、链上 DID 文档比对和回滚触发。 | `UserUpgradeFlowService` | `UserUpgradeRepository`, `RealIdPassportZkpProvider`, `UserRollbackFlowService` |
| `lib/features/identity/domain/key_rotation_flow_service.dart` | 用户密钥轮换流程，生成新密钥、构建签名/上链请求、保存 pending、恢复未完成流程并做链上 DID 文档比对。 | `UserKeyRotationFlowService` | `KeyRotationRepository`, `UserRollbackFlowService`, `PendingKeyRotationGuard` |
| `lib/features/device/domain/device_migration_flow_service.dart` | 设备迁移流程，负责新设备二维码材料、旧设备发起迁移、签名、状态查询、onchain、比对和账号同步。 | `DeviceMigrationFlowService` | `DeviceMigrationRepository`, `DeviceMigrationLocalStore`, `RegisterOnchainPayloadBuilder` |
| `lib/features/settings/domain/account_cancellation_flow_service.dart` | Real ID 注销流程，校验登录态、账户状态、pending 密钥轮换、链上 key set，生成注销签名并提交注销。 | `AccountCancellationFlowService` | `AccountCancellationRepository`, `PendingKeyRotationGuard`, `RegistrationChainDidDocumentProvider` |
| `lib/features/social/domain/social_recovery_flow_service.dart` | 社交恢复流程，负责本机身份预检、邮箱验证、恢复发起、组员消息、签名验证、恢复确认和终端数据核验。 | `SocialRecoveryFlowService` | `SocialRecoveryRepository`, `LifecycleRecoveryCoordinator` |
| `lib/features/social/domain/realtime_identity_flow_service.dart` | 实时核身流程，负责发起核身、查询消息、验证签名消息并保存本地记录。 | `RealtimeIdentityFlowService` | `RealtimeIdentityRepository`, `RealtimeIdentitySignatureBuilder` |
| `lib/services/crypto_service.dart` | Flutter 到原生加密能力的 MethodChannel，封装密钥生成、签名、验签、P-256 安全区、生物识别会话。 | `CryptoService`, `CryptoResult` | `MethodChannel('real_id_flutter/crypto')` |
| `lib/pigeon/real_id_pigeon.dart` | Flutter 与宿主平台的 Pigeon 接口，包含身份认证结果、身份证信息、环境检测结果等跨端模型。 | `RealIdApi`, `AuthResult`, `IdCardInfo`, `EnvDetectionResult` | Flutter Pigeon |

## iOS 原生 `ios_realid/`

| 文件 | 摘要 | 关键定义 | 依赖 |
| --- | --- | --- | --- |
| `REALID/Api/CustomPlugin.swift` | Moya 请求插件，统一添加公共参数、排序签名、AES-GCM 加密请求体、解密响应并按需验签。 | `SecurityPlugin` | `RequestPubParamManager`, `AESUtil`, `ECDSAUtil`, `RSSDKSwiftUtil` |
| `REALID/Util/SecurityUtil.swift` | 安全通道协商，生成 ECDH 临时密钥、构建 ClientPacket、ECIES 加密、ECDSA 签名、校验服务端包并派生 AES key/IV。 | `SecurityUtil.KeyAgreement`, `SecurityError` | `OpenSSLUtil`, `ECIESUtil`, `KDF`, `AESUtil` |
| `REALID/Lib/realid_rs_sdk.h` | Rust SDK FFI 头文件，提供用户密钥对、EdDSA 签名、身份承诺和匿名群组授权证明生成。 | `realid_generate_user_key_pair`, `realid_get_auth_proof` | FFI C ABI |
| `REALID/Main/*` | 原生页面覆盖登录、注册、首页、好友、群组、消息、设置、设备迁移、升级等用户流程。 | 多个 `VC` | `Moya`, `RxSwift`, 原生安全工具 |

## Java 后端 `did-server/`

| 文件 | 摘要 | 关键定义 | 依赖 |
| --- | --- | --- | --- |
| `did-service/.../Controller/v1/security/SecurityController.java` | 传输安全通道协商，处理客户端公钥包和签名，调用安全通道工具生成服务端包、会话 key，并将会话写入 Redis。 | `initiate` | `SafetyPassageUtils`, `RedisTemplate`, `SecretKeyConfig` |
| `did-service/.../Controller/v1/email/EmailController.java` | 邮箱验证码发送和校验，按注册、登录、恢复等 email_type 执行业务校验。 | `send`, `validateCode` | `EmailService`, `ITBusRidacService` |
| `did-service/.../Controller/v1/auth/LoginController.java` | 设备指纹登录与邮箱登录，创建 Redis 登录有效会话并返回账户状态。 | `fingerLogin`, `email` | `RedisTemplate`, `ITBusRidacService` |
| `did-service/.../Controller/v1/did/register/DidRegisterController.java` | DID 注册 v1 接口，负责 registration validation、注册数据上链、注册 DID 文档比对结果上传。 | `validation`, `onchain`, `comparisonResultUpload` | `ITBusRidacService`, `FileterUtil` |
| `did-service/.../Controller/v1/did/config/AppConfigController.java` | DID 应用配置与 action 配置查询，向端侧提供链 ID、gateway、nonce、deadline 等上链配置。 | `appInfoQuery`, `action` | `ITBusAppInfoConfigService` |
| `did-service/.../Controller/v1/did/update/DidUpdateController.java` | 旧版和兼容版 DID 更新、注册、登录、用户信息、头像、注销、护照更新、密钥更新和比对上传接口。 | 多个 `/api/v1/did/update/*` 方法 | `ITBusRidacService`, `ChainService` |
| `did-service/.../Controller/v1/did/key/KeyRotationController.java` | Interface 3.0.0 密钥轮换标准路径，发起密钥轮换上链并上传比对结果。 | `rotateKey`, `rotationComparisonResult` | `ITBusRidSecretkeyUpdateLogService` |
| `did-service/.../Controller/v1/did/migration/MigrationController.java` | 设备迁移接口，解析新设备二维码 TLV，创建迁移记录、查询状态、提交上链、上传比对结果。 | `initiate`, `status`, `onchain`, `deviceMigrationComparResultUpload` | `TlvUtils`, `ITBusRidDeviceMigrationLogService`, `RedisTemplate` |
| `did-service/.../Controller/v1/did/invalidate/DidInvalidateController.java` | DID 回滚/无效化接口，提交 invalidate 上链与比对结果。 | `onchain`, `comparisonResult` | `ITBusRidacService` |
| `did-service/.../Controller/v1/social/SocialV1Controller.java` | 社交关系、群组、社交恢复、实时核身、挖矿记录等接口。 | `recoverLaunch`, `recoverConfirm`, `recoverDataCheckOnChain`, `realtimeLaunch`, `realtimeConfirm` | `groupListService`, `messageService`, `chainService`, `RedisTemplate` |
| `did-service/.../Controller/v1/message/MessageV1Controller.java` | 消息列表、消息验证、未读/新消息状态和已读状态更新。 | `list`, `verify`, `unreadStatus`, `newStatus`, `updateReadState` | `messageService` |
| `did-service/.../Controller/v1/session/SessionController.java` | 登录会话心跳。 | `heartbeat` | `RedisTemplate`, `FileterUtil` |
| `did-service/.../Controller/v1/zk/ZkProvingKeyController.java` | ZK proving key 查询。 | `query` | `TBusRidZkProvingKeyService` |

## Solidity 合约 `realidentitydid-contract/`

| 文件 | 摘要 | 关键定义 | 依赖 |
| --- | --- | --- | --- |
| `protocol/contracts/gateway/RealIDGateway.sol` | 链上核心状态机，使用 receipt 模式执行注册、护照更新、密钥轮换、注销、设备迁移、迁移审批和无效化，并校验 relayer、nonce、deadline、actionCode、签名、当前 key set、用户类型和 ZK proof。 | `registerWithReceipt`, `updateWithReceipt`, `rotationKeyWithReceipt`, `deprecateWithReceipt`, `deviceMigrationWithReceipt`, `deviceMigrationWithApprovalReceipt`, `invalidateWithReceipt` | `RealIDEIP712`, `RealIDSignatures`, `IRealIDRegistry`, `IRealIDGatewayState`, `IZKProofVerifier` |
| `protocol/contracts/state/RealIDGatewayState.sol` | Gateway 状态存储，记录 DID 注册状态、nonce、alias、当前 key set hash、DID 状态，并仅允许 Gateway 更新。 | `registerDid`, `updateDid`, `rotateDid`, `migrateDid`, `deactivateDid`, `invalidateDid`, `restoreDid` | Gateway 授权 |
| `protocol/contracts/registry/RealIDRegistry.sol` | DID 文档事件源，Gateway 可写 attribute/delegate/owner 变更，owner 可替换 Gateway。 | `setAttribute`, `batchSetAttributes`, `revokeAttribute`, `addDelegate`, `revokeDelegate` | EIP-1967 UUPS |
| `protocol/contracts/diddoc/RealIDDidDocWriterV1.sol` | DID 文档写入代理，统一写入注册、更新、轮换、设备迁移和撤销相关 DID 文档属性。 | `writeDidDocRegistration`, `writeDidDocUpdate`, `writeDidDocRotation`, `writeDidDocDeviceMigration`, `revokeDidDoc` | `IRealIDRegistry` |
| `protocol/contracts/zk/PassportProofRouter.sol` | 按护照算法选择 Groth16 verifier，校验 issuerPubkeyHash 和 identifier 落在 BN254 标量域内，并把两个公共信号传入 verifier。 | `setVerifier`, `verifyProof` | `IGroth16Verifier`, `Ownable` |
| `indexer/subgraph/schema.graphql` 与 `indexer/subgraph/src/*` | 监听 Registry/Gateway 事件并为 DID 文档解析提供索引。 | `gateway.ts`, `registry.ts` | The Graph |

