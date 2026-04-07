// TypeScript contracts derived from docs/API.md.
// Field names and nullability rules match the documented serialization contract exactly.

// ── Envelope ──────────────────────────────────────────────────────────────────

export interface SuccessEnvelope<T> {
  ok: true;
  data: T;
  revision: string;
}

export interface ErrorDetail {
  code: string;
  message: string;
}

export interface ErrorEnvelope {
  ok: false;
  error: ErrorDetail;
  request_id: number;
}

export type ApiResponse<T> = SuccessEnvelope<T> | ErrorEnvelope;

// ── Health ────────────────────────────────────────────────────────────────────

export interface HealthData {
  status: string;
  read_only: boolean;
}

// ── System info ───────────────────────────────────────────────────────────────

export interface SystemInfoData {
  version: string;
  target_arch: string;
  target_os: string;
  build_profile: string;
  git_commit?: string;
  build_time_utc?: string;
  rustc_version?: string;
  process_started_at_epoch_secs: number;
  uptime_seconds: number;
  config_path: string;
  config_hash: string;
  config_reload_count: number;
  last_config_reload_epoch_secs?: number;
}

// ── Runtime gates ─────────────────────────────────────────────────────────────

export interface RuntimeGatesData {
  accepting_new_connections: boolean;
  conditional_cast_enabled: boolean;
  me_runtime_ready: boolean;
  me2dc_fallback_enabled: boolean;
  use_middle_proxy: boolean;
  startup_status: string;
  startup_stage: string;
  startup_progress_pct: number;
}

// ── Runtime initialization ────────────────────────────────────────────────────

export interface RuntimeInitializationMeData {
  status: string;
  current_stage: string;
  progress_pct: number;
  init_attempt: number;
  retry_limit: string;
  last_error?: string;
}

export interface RuntimeInitializationComponentData {
  id: string;
  title: string;
  status: string;
  started_at_epoch_ms?: number;
  finished_at_epoch_ms?: number;
  duration_ms?: number;
  attempts: number;
  details?: string;
}

export interface RuntimeInitializationData {
  status: string;
  degraded: boolean;
  current_stage: string;
  progress_pct: number;
  started_at_epoch_secs: number;
  ready_at_epoch_secs?: number;
  total_elapsed_ms: number;
  transport_mode: string;
  me: RuntimeInitializationMeData;
  components: RuntimeInitializationComponentData[];
}

// ── Effective limits ──────────────────────────────────────────────────────────

export interface EffectiveTimeoutLimits {
  client_handshake_secs: number;
  tg_connect_secs: number;
  client_keepalive_secs: number;
  client_ack_secs: number;
  me_one_retry: number;
  me_one_timeout_ms: number;
}

export interface EffectiveUpstreamLimits {
  connect_retry_attempts: number;
  connect_retry_backoff_ms: number;
  connect_budget_ms: number;
  unhealthy_fail_threshold: number;
  connect_failfast_hard_errors: boolean;
}

export interface EffectiveMiddleProxyLimits {
  floor_mode: string;
  adaptive_floor_idle_secs: number;
  adaptive_floor_min_writers_single_endpoint: number;
  adaptive_floor_min_writers_multi_endpoint: number;
  adaptive_floor_recover_grace_secs: number;
  adaptive_floor_writers_per_core_total: number;
  adaptive_floor_cpu_cores_override: number;
  adaptive_floor_max_extra_writers_single_per_core: number;
  adaptive_floor_max_extra_writers_multi_per_core: number;
  adaptive_floor_max_active_writers_per_core: number;
  adaptive_floor_max_warm_writers_per_core: number;
  adaptive_floor_max_active_writers_global: number;
  adaptive_floor_max_warm_writers_global: number;
  reconnect_max_concurrent_per_dc: number;
  reconnect_backoff_base_ms: number;
  reconnect_backoff_cap_ms: number;
  reconnect_fast_retry_count: number;
  writer_pick_mode: string;
  writer_pick_sample_size: number;
  me2dc_fallback: boolean;
}

export interface EffectiveUserIpPolicyLimits {
  mode: string;
  window_secs: number;
}

export interface EffectiveLimitsData {
  update_every_secs: number;
  me_reinit_every_secs: number;
  me_pool_force_close_secs: number;
  timeouts: EffectiveTimeoutLimits;
  upstream: EffectiveUpstreamLimits;
  middle_proxy: EffectiveMiddleProxyLimits;
  user_ip_policy: EffectiveUserIpPolicyLimits;
}

// ── Security ──────────────────────────────────────────────────────────────────

export interface SecurityPostureData {
  api_read_only: boolean;
  api_whitelist_enabled: boolean;
  api_whitelist_entries: number;
  api_auth_header_enabled: boolean;
  proxy_protocol_enabled: boolean;
  log_level: string;
  telemetry_core_enabled: boolean;
  telemetry_user_enabled: boolean;
  telemetry_me_level: string;
}

export interface SecurityWhitelistData {
  generated_at_epoch_secs: number;
  enabled: boolean;
  entries_total: number;
  entries: string[];
}

// ── Stats summary ─────────────────────────────────────────────────────────────

export interface SummaryData {
  uptime_seconds: number;
  connections_total: number;
  connections_bad_total: number;
  handshake_timeouts_total: number;
  configured_users: number;
}

// ── Zero counters ─────────────────────────────────────────────────────────────

export interface ZeroCodeCount {
  code: number;
  total: number;
}

export interface ZeroCoreData {
  uptime_seconds: number;
  connections_total: number;
  connections_bad_total: number;
  handshake_timeouts_total: number;
  configured_users: number;
  telemetry_core_enabled: boolean;
  telemetry_user_enabled: boolean;
  telemetry_me_level: string;
}

export interface ZeroUpstreamData {
  connect_attempt_total: number;
  connect_success_total: number;
  connect_fail_total: number;
  connect_failfast_hard_error_total: number;
  connect_attempts_bucket_1: number;
  connect_attempts_bucket_2: number;
  connect_attempts_bucket_3_4: number;
  connect_attempts_bucket_gt_4: number;
  connect_duration_success_bucket_le_100ms: number;
  connect_duration_success_bucket_101_500ms: number;
  connect_duration_success_bucket_501_1000ms: number;
  connect_duration_success_bucket_gt_1000ms: number;
  connect_duration_fail_bucket_le_100ms: number;
  connect_duration_fail_bucket_101_500ms: number;
  connect_duration_fail_bucket_501_1000ms: number;
  connect_duration_fail_bucket_gt_1000ms: number;
}

export interface ZeroMiddleProxyData {
  keepalive_sent_total: number;
  keepalive_failed_total: number;
  keepalive_pong_total: number;
  keepalive_timeout_total: number;
  rpc_proxy_req_signal_sent_total: number;
  rpc_proxy_req_signal_failed_total: number;
  rpc_proxy_req_signal_skipped_no_meta_total: number;
  rpc_proxy_req_signal_response_total: number;
  rpc_proxy_req_signal_close_sent_total: number;
  reconnect_attempt_total: number;
  reconnect_success_total: number;
  handshake_reject_total: number;
  handshake_error_codes: ZeroCodeCount[];
  reader_eof_total: number;
  idle_close_by_peer_total: number;
  route_drop_no_conn_total: number;
  route_drop_channel_closed_total: number;
  route_drop_queue_full_total: number;
  route_drop_queue_full_base_total: number;
  route_drop_queue_full_high_total: number;
  socks_kdf_strict_reject_total: number;
  socks_kdf_compat_fallback_total: number;
  endpoint_quarantine_total: number;
  kdf_drift_total: number;
  kdf_port_only_drift_total: number;
  hardswap_pending_reuse_total: number;
  hardswap_pending_ttl_expired_total: number;
  single_endpoint_outage_enter_total: number;
  single_endpoint_outage_exit_total: number;
  single_endpoint_outage_reconnect_attempt_total: number;
  single_endpoint_outage_reconnect_success_total: number;
  single_endpoint_quarantine_bypass_total: number;
  single_endpoint_shadow_rotate_total: number;
  single_endpoint_shadow_rotate_skipped_quarantine_total: number;
  floor_mode_switch_total: number;
  floor_mode_switch_static_to_adaptive_total: number;
  floor_mode_switch_adaptive_to_static_total: number;
}

export interface ZeroPoolData {
  pool_swap_total: number;
  pool_drain_active: number;
  pool_force_close_total: number;
  pool_stale_pick_total: number;
  writer_removed_total: number;
  writer_removed_unexpected_total: number;
  refill_triggered_total: number;
  refill_skipped_inflight_total: number;
  refill_failed_total: number;
  writer_restored_same_endpoint_total: number;
  writer_restored_fallback_total: number;
}

export interface ZeroDesyncData {
  secure_padding_invalid_total: number;
  desync_total: number;
  desync_full_logged_total: number;
  desync_suppressed_total: number;
  desync_frames_bucket_0: number;
  desync_frames_bucket_1_2: number;
  desync_frames_bucket_3_10: number;
  desync_frames_bucket_gt_10: number;
}

export interface ZeroAllData {
  generated_at_epoch_secs: number;
  core: ZeroCoreData;
  upstream: ZeroUpstreamData;
  middle_proxy: ZeroMiddleProxyData;
  pool: ZeroPoolData;
  desync: ZeroDesyncData;
}

// ── Upstreams ─────────────────────────────────────────────────────────────────

export interface UpstreamSummaryData {
  configured_total: number;
  healthy_total: number;
  unhealthy_total: number;
  direct_total: number;
  socks4_total: number;
  socks5_total: number;
  shadowsocks_total: number;
}

export interface UpstreamDcStatus {
  dc: number;
  latency_ema_ms?: number;
  ip_preference: string;
}

export interface UpstreamStatus {
  upstream_id: number;
  route_kind: string;
  address: string;
  weight: number;
  scopes: string;
  healthy: boolean;
  fails: number;
  last_check_age_secs: number;
  effective_latency_ms?: number;
  dc: UpstreamDcStatus[];
}

export interface UpstreamsData {
  enabled: boolean;
  reason?: string;
  generated_at_epoch_secs: number;
  zero: ZeroUpstreamData;
  summary?: UpstreamSummaryData;
  upstreams?: UpstreamStatus[];
}

// ── ME writers ────────────────────────────────────────────────────────────────

export interface MeWritersSummary {
  configured_dc_groups: number;
  configured_endpoints: number;
  available_endpoints: number;
  available_pct: number;
  required_writers: number;
  alive_writers: number;
  coverage_pct: number;
}

export interface MeWriterStatus {
  writer_id: number;
  dc?: number;
  endpoint: string;
  generation: number;
  state: string;
  draining: boolean;
  degraded: boolean;
  bound_clients: number;
  idle_for_secs?: number;
  rtt_ema_ms?: number;
}

export interface MeWritersData {
  middle_proxy_enabled: boolean;
  reason?: string;
  generated_at_epoch_secs: number;
  summary: MeWritersSummary;
  writers: MeWriterStatus[];
}

// ── DC status ─────────────────────────────────────────────────────────────────

export interface DcEndpointWriters {
  endpoint: string;
  active_writers: number;
}

export interface DcStatus {
  dc: number;
  endpoints: string[];
  endpoint_writers: DcEndpointWriters[];
  available_endpoints: number;
  available_pct: number;
  required_writers: number;
  floor_min: number;
  floor_target: number;
  floor_max: number;
  floor_capped: boolean;
  alive_writers: number;
  coverage_pct: number;
  rtt_ms?: number;
  load: number;
}

export interface DcStatusData {
  middle_proxy_enabled: boolean;
  reason?: string;
  generated_at_epoch_secs: number;
  dcs: DcStatus[];
}

// ── Runtime ME pool state ─────────────────────────────────────────────────────

export interface RuntimeMePoolStateGenerationData {
  active_generation: number;
  warm_generation: number;
  pending_hardswap_generation: number;
  pending_hardswap_age_secs?: number;
  draining_generations: number[];
}

export interface RuntimeMePoolStateHardswapData {
  enabled: boolean;
  pending: boolean;
}

export interface RuntimeMePoolStateWriterContourData {
  warm: number;
  active: number;
  draining: number;
}

export interface RuntimeMePoolStateWriterHealthData {
  healthy: number;
  degraded: number;
  draining: number;
}

export interface RuntimeMePoolStateWriterData {
  total: number;
  alive_non_draining: number;
  draining: number;
  degraded: number;
  contour: RuntimeMePoolStateWriterContourData;
  health: RuntimeMePoolStateWriterHealthData;
}

export interface RuntimeMePoolStateRefillDcData {
  dc: number;
  family: string;
  inflight: number;
}

export interface RuntimeMePoolStateRefillData {
  inflight_endpoints_total: number;
  inflight_dc_total: number;
  by_dc: RuntimeMePoolStateRefillDcData[];
}

export interface RuntimeMePoolStatePayload {
  generations: RuntimeMePoolStateGenerationData;
  hardswap: RuntimeMePoolStateHardswapData;
  writers: RuntimeMePoolStateWriterData;
  refill: RuntimeMePoolStateRefillData;
}

export interface RuntimeMePoolStateData {
  enabled: boolean;
  reason?: string;
  generated_at_epoch_secs: number;
  data?: RuntimeMePoolStatePayload;
}

// ── Runtime ME quality ────────────────────────────────────────────────────────

export interface RuntimeMeQualityCountersData {
  idle_close_by_peer_total: number;
  reader_eof_total: number;
  kdf_drift_total: number;
  kdf_port_only_drift_total: number;
  reconnect_attempt_total: number;
  reconnect_success_total: number;
}

export interface RuntimeMeQualityRouteDropData {
  no_conn_total: number;
  channel_closed_total: number;
  queue_full_total: number;
  queue_full_base_total: number;
  queue_full_high_total: number;
}

export interface RuntimeMeQualityDcRttData {
  dc: number;
  rtt_ema_ms?: number;
  alive_writers: number;
  required_writers: number;
  coverage_pct: number;
}

export interface RuntimeMeQualityPayload {
  counters: RuntimeMeQualityCountersData;
  route_drops: RuntimeMeQualityRouteDropData;
  dc_rtt: RuntimeMeQualityDcRttData[];
}

export interface RuntimeMeQualityData {
  enabled: boolean;
  reason?: string;
  generated_at_epoch_secs: number;
  data?: RuntimeMeQualityPayload;
}

// ── Runtime upstream quality ──────────────────────────────────────────────────

export interface RuntimeUpstreamQualityPolicyData {
  connect_retry_attempts: number;
  connect_retry_backoff_ms: number;
  connect_budget_ms: number;
  unhealthy_fail_threshold: number;
  connect_failfast_hard_errors: boolean;
}

export interface RuntimeUpstreamQualityCountersData {
  connect_attempt_total: number;
  connect_success_total: number;
  connect_fail_total: number;
  connect_failfast_hard_error_total: number;
}

export interface RuntimeUpstreamQualitySummaryData {
  configured_total: number;
  healthy_total: number;
  unhealthy_total: number;
  direct_total: number;
  socks4_total: number;
  socks5_total: number;
  shadowsocks_total: number;
}

export interface RuntimeUpstreamQualityDcData {
  dc: number;
  latency_ema_ms?: number;
  ip_preference: string;
}

export interface RuntimeUpstreamQualityUpstreamData {
  upstream_id: number;
  route_kind: string;
  address: string;
  weight: number;
  scopes: string;
  healthy: boolean;
  fails: number;
  last_check_age_secs: number;
  effective_latency_ms?: number;
  dc: RuntimeUpstreamQualityDcData[];
}

export interface RuntimeUpstreamQualityData {
  enabled: boolean;
  reason?: string;
  generated_at_epoch_secs: number;
  policy: RuntimeUpstreamQualityPolicyData;
  counters: RuntimeUpstreamQualityCountersData;
  summary?: RuntimeUpstreamQualitySummaryData;
  upstreams?: RuntimeUpstreamQualityUpstreamData[];
}

// ── Runtime NAT/STUN ──────────────────────────────────────────────────────────

export interface RuntimeNatStunFlagsData {
  nat_probe_enabled: boolean;
  nat_probe_disabled_runtime: boolean;
  nat_probe_attempts: number;
}

export interface RuntimeNatStunServersData {
  configured: string[];
  live: string[];
  live_total: number;
}

export interface RuntimeNatStunReflectionData {
  addr: string;
  age_secs: number;
}

export interface RuntimeNatStunReflectionBlockData {
  v4?: RuntimeNatStunReflectionData;
  v6?: RuntimeNatStunReflectionData;
}

export interface RuntimeNatStunPayload {
  flags: RuntimeNatStunFlagsData;
  servers: RuntimeNatStunServersData;
  reflection: RuntimeNatStunReflectionBlockData;
  stun_backoff_remaining_ms?: number;
}

export interface RuntimeNatStunData {
  enabled: boolean;
  reason?: string;
  generated_at_epoch_secs: number;
  data?: RuntimeNatStunPayload;
}

// ── Runtime ME selftest ───────────────────────────────────────────────────────

export interface RuntimeMeSelftestKdfData {
  state: string;
  ewma_errors_per_min: number;
  threshold_errors_per_min: number;
  errors_total: number;
}

export interface RuntimeMeSelftestTimeskewData {
  state: string;
  max_skew_secs_15m?: number;
  samples_15m: number;
  last_skew_secs?: number;
  last_source?: string;
  last_seen_age_secs?: number;
}

export interface RuntimeMeSelftestIpFamilyData {
  addr: string;
  state: string;
}

export interface RuntimeMeSelftestIpData {
  v4?: RuntimeMeSelftestIpFamilyData;
  v6?: RuntimeMeSelftestIpFamilyData;
}

export interface RuntimeMeSelftestPidData {
  pid: number;
  state: string;
}

export interface RuntimeMeSelftestBndData {
  addr_state: string;
  port_state: string;
  last_addr?: string;
  last_seen_age_secs?: number;
}

export interface RuntimeMeSelftestPayload {
  kdf: RuntimeMeSelftestKdfData;
  timeskew: RuntimeMeSelftestTimeskewData;
  ip: RuntimeMeSelftestIpData;
  pid: RuntimeMeSelftestPidData;
  bnd: RuntimeMeSelftestBndData;
}

export interface RuntimeMeSelftestData {
  enabled: boolean;
  reason?: string;
  generated_at_epoch_secs: number;
  data?: RuntimeMeSelftestPayload;
}

// ── Runtime edge connections ──────────────────────────────────────────────────

export interface RuntimeEdgeConnectionCacheData {
  ttl_ms: number;
  served_from_cache: boolean;
  stale_cache_used: boolean;
}

export interface RuntimeEdgeConnectionTotalsData {
  current_connections: number;
  current_connections_me: number;
  current_connections_direct: number;
  active_users: number;
}

export interface RuntimeEdgeConnectionUserData {
  username: string;
  current_connections: number;
  total_octets: number;
}

export interface RuntimeEdgeConnectionTopData {
  limit: number;
  by_connections: RuntimeEdgeConnectionUserData[];
  by_throughput: RuntimeEdgeConnectionUserData[];
}

export interface RuntimeEdgeConnectionTelemetryData {
  user_enabled: boolean;
  throughput_is_cumulative: boolean;
}

export interface RuntimeEdgeConnectionsSummaryPayload {
  cache: RuntimeEdgeConnectionCacheData;
  totals: RuntimeEdgeConnectionTotalsData;
  top: RuntimeEdgeConnectionTopData;
  telemetry: RuntimeEdgeConnectionTelemetryData;
}

export interface RuntimeEdgeConnectionsSummaryData {
  enabled: boolean;
  reason?: string;
  generated_at_epoch_secs: number;
  data?: RuntimeEdgeConnectionsSummaryPayload;
}

// ── Runtime edge events ───────────────────────────────────────────────────────

export interface ApiEventRecord {
  seq: number;
  ts_epoch_secs: number;
  event_type: string;
  context: string;
}

export interface RuntimeEdgeEventsPayload {
  capacity: number;
  dropped_total: number;
  events: ApiEventRecord[];
}

export interface RuntimeEdgeEventsData {
  enabled: boolean;
  reason?: string;
  generated_at_epoch_secs: number;
  data?: RuntimeEdgeEventsPayload;
}

// ── Minimal all ───────────────────────────────────────────────────────────────

export interface MinimalQuarantineData {
  endpoint: string;
  remaining_ms: number;
}

export interface MinimalMeRuntimeData {
  active_generation: number;
  warm_generation: number;
  pending_hardswap_generation: number;
  pending_hardswap_age_secs?: number;
  hardswap_enabled: boolean;
  floor_mode: string;
  adaptive_floor_idle_secs: number;
  adaptive_floor_min_writers_single_endpoint: number;
  adaptive_floor_min_writers_multi_endpoint: number;
  adaptive_floor_recover_grace_secs: number;
  adaptive_floor_writers_per_core_total: number;
  adaptive_floor_cpu_cores_override: number;
  adaptive_floor_max_extra_writers_single_per_core: number;
  adaptive_floor_max_extra_writers_multi_per_core: number;
  adaptive_floor_max_active_writers_per_core: number;
  adaptive_floor_max_warm_writers_per_core: number;
  adaptive_floor_max_active_writers_global: number;
  adaptive_floor_max_warm_writers_global: number;
  adaptive_floor_cpu_cores_detected: number;
  adaptive_floor_cpu_cores_effective: number;
  adaptive_floor_global_cap_raw: number;
  adaptive_floor_global_cap_effective: number;
  adaptive_floor_target_writers_total: number;
  adaptive_floor_active_cap_configured: number;
  adaptive_floor_active_cap_effective: number;
  adaptive_floor_warm_cap_configured: number;
  adaptive_floor_warm_cap_effective: number;
  adaptive_floor_active_writers_current: number;
  adaptive_floor_warm_writers_current: number;
  me_keepalive_enabled: boolean;
  me_keepalive_interval_secs: number;
  me_keepalive_jitter_secs: number;
  me_keepalive_payload_random: boolean;
  rpc_proxy_req_every_secs: number;
  me_reconnect_max_concurrent_per_dc: number;
  me_reconnect_backoff_base_ms: number;
  me_reconnect_backoff_cap_ms: number;
  me_reconnect_fast_retry_count: number;
  me_pool_drain_ttl_secs: number;
  me_pool_force_close_secs: number;
  me_pool_min_fresh_ratio: number;
  me_bind_stale_mode: string;
  me_bind_stale_ttl_secs: number;
  me_single_endpoint_shadow_writers: number;
  me_single_endpoint_outage_mode_enabled: boolean;
  me_single_endpoint_outage_disable_quarantine: boolean;
  me_single_endpoint_outage_backoff_min_ms: number;
  me_single_endpoint_outage_backoff_max_ms: number;
  me_single_endpoint_shadow_rotate_every_secs: number;
  me_deterministic_writer_sort: boolean;
  me_writer_pick_mode: string;
  me_writer_pick_sample_size: number;
  me_socks_kdf_policy: string;
  quarantined_endpoints_total: number;
  quarantined_endpoints: MinimalQuarantineData[];
}

export interface MinimalDcPathData {
  dc: number;
  ip_preference?: string;
  selected_addr_v4?: string;
  selected_addr_v6?: string;
}

export interface MinimalAllPayload {
  me_writers: MeWritersData;
  dcs: DcStatusData;
  me_runtime?: MinimalMeRuntimeData;
  network_path: MinimalDcPathData[];
}

export interface MinimalAllData {
  enabled: boolean;
  reason?: string;
  generated_at_epoch_secs: number;
  data?: MinimalAllPayload;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserLinks {
  classic: string[];
  secure: string[];
  tls: string[];
}

export interface UserInfo {
  username: string;
  user_ad_tag?: string;
  max_tcp_conns?: number;
  expiration_rfc3339?: string;
  data_quota_bytes?: number;
  max_unique_ips?: number;
  current_connections: number;
  active_unique_ips: number;
  active_unique_ips_list: string[];
  recent_unique_ips: number;
  recent_unique_ips_list: string[];
  total_octets: number;
  links: UserLinks;
}

export interface CreateUserRequest {
  username: string;
  secret?: string;
  user_ad_tag?: string;
  max_tcp_conns?: number;
  expiration_rfc3339?: string;
  data_quota_bytes?: number;
  max_unique_ips?: number;
}

export interface PatchUserRequest {
  secret?: string;
  user_ad_tag?: string;
  max_tcp_conns?: number;
  expiration_rfc3339?: string;
  data_quota_bytes?: number;
  max_unique_ips?: number;
}

export interface CreateUserResponse {
  user: UserInfo;
  secret: string;
}