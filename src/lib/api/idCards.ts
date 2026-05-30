// src/lib/api/idCards.ts

import { api } from './client';

export interface GetIdCardsParams {
  classLevelId?: number;
  classSectionId?: number;
  search?: string;
  page?: number;
  size?: number;
}

export const getIdCards = async (params: GetIdCardsParams) => {
  const res = await api.get('/api/students/id-cards', { params });
  return res.data.data; // Page<IdCardSummaryResponse>
};

export const getSingleIdCard = async (studentId: string) => {
  const res = await api.get(`/api/v1/id-cards/student/${studentId}`);
  return res.data.data;
};

export const getBatchIdCards = async (studentIds: string[]) => {
  const res = await api.post('/api/v1/id-cards/batch', studentIds);
  return res.data.data;
};