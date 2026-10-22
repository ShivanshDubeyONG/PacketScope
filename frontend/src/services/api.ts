/** API client service for PacketScope */

import {
  Capture,
  CaptureListResponse,
  PacketListResponse,
  AlertListResponse,
  Statistics,
  HealthStatus,
} from '../types';

const API_BASE = '/api/v1';

export const api = {
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to retrieve health status');
    return res.json();
  },

  async listCaptures(skip = 0, limit = 50): Promise<CaptureListResponse> {
    const res = await fetch(`${API_BASE}/captures?skip=${skip}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch captures');
    return res.json();
  },

  async getCapture(id: string): Promise<Capture> {
    const res = await fetch(`${API_BASE}/captures/${id}`);
    if (!res.ok) throw new Error(`Capture ${id} not found`);
    return res.json();
  },

  async uploadCapture(file: File, analyzeImmediately = true): Promise<Capture> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/captures?analyze_immediately=${analyzeImmediately}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: 'Upload failed' } }));
      throw new Error(err.error?.message || 'Failed to upload and analyze capture');
    }
    return res.json();
  },

  async getStatistics(captureId: string): Promise<Statistics> {
    const res = await fetch(`${API_BASE}/captures/${captureId}/statistics`);
    if (!res.ok) throw new Error('Failed to fetch capture statistics');
    return res.json();
  },

  async getAlerts(captureId: string, severity?: string): Promise<AlertListResponse> {
    const url = severity
      ? `${API_BASE}/captures/${captureId}/alerts?severity=${severity}`
      : `${API_BASE}/captures/${captureId}/alerts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch capture alerts');
    return res.json();
  },

  async getPackets(
    captureId: string,
    params: {
      page?: number;
      page_size?: number;
      protocol?: string;
      source_ip?: string;
      dest_ip?: string;
      source_port?: number;
      dest_port?: number;
      search?: string;
      time_start?: number;
      time_end?: number;
    } = {}
  ): Promise<PacketListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.page_size) query.set('page_size', params.page_size.toString());
    if (params.protocol) query.set('protocol', params.protocol);
    if (params.source_ip) query.set('source_ip', params.source_ip);
    if (params.dest_ip) query.set('dest_ip', params.dest_ip);
    if (params.source_port) query.set('source_port', params.source_port.toString());
    if (params.dest_port) query.set('dest_port', params.dest_port.toString());
    if (params.search) query.set('search', params.search);
    if (params.time_start !== undefined) query.set('time_start', params.time_start.toString());
    if (params.time_end !== undefined) query.set('time_end', params.time_end.toString());

    const res = await fetch(`${API_BASE}/captures/${captureId}/packets?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch packet records');
    return res.json();
  },

  getExportUrl(captureId: string, format: 'xml' | 'sqlite' | 'csv' | 'json'): string {
    return `${API_BASE}/captures/${captureId}/exports/${format}`;
  },
};
