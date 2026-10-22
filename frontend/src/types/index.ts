/** PacketScope TypeScript type definitions */

export interface Capture {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  file_hash_sha256: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  packet_count: number;
  duration_seconds: number;
  risk_score: number;
  risk_level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  created_at: string;
  processed_at?: string;
  error_message?: string;
}

export interface CaptureListResponse {
  total: number;
  items: Capture[];
}

export interface Packet {
  id: string;
  capture_id: string;
  packet_number: number;
  timestamp: string;
  relative_time: number;
  source_mac?: string;
  dest_mac?: string;
  source_ip?: string;
  dest_ip?: string;
  ip_version?: number;
  transport_protocol?: string;
  source_port?: number;
  dest_port?: number;
  packet_length: number;
  tcp_flags?: string;
  dns_query_name?: string;
  dns_query_type?: string;
  http_method?: string;
  http_host?: string;
  http_uri?: string;
  icmp_type?: number;
  summary_info?: string;
}

export interface PacketListResponse {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  items: Packet[];
}

export interface Alert {
  id: string;
  capture_id: string;
  rule_id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  explanation: string;
  evidence: string;
  source_ip?: string;
  dest_ip?: string;
  source_port?: number;
  dest_port?: number;
  first_seen?: string;
  last_seen?: string;
  event_count: number;
  recommendation: string;
  disclaimer: string;
}

export interface AlertListResponse {
  total: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  items: Alert[];
}

export interface TopTalker {
  ip: string;
  packet_count: number;
  byte_count: number;
  role: string;
}

export interface TopConversation {
  source_ip: string;
  dest_ip: string;
  protocol: string;
  packet_count: number;
  byte_count: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  packet_count: number;
  byte_count: number;
}

export interface Statistics {
  id: string;
  capture_id: string;
  total_packets: number;
  duration_seconds: number;
  start_time?: string;
  end_time?: string;
  total_bytes: number;
  avg_packet_size: number;
  packets_per_second: number;
  unique_src_ips: number;
  unique_dst_ips: number;
  protocol_distribution: Record<string, number>;
  port_distribution: Record<string, number>;
  top_talkers: TopTalker[];
  top_conversations: TopConversation[];
  time_series: TimeSeriesPoint[];
}

export interface HealthStatus {
  status: string;
  service: string;
  database: string;
  tshark: {
    available: boolean;
    path: string;
  };
  environment: string;
}
