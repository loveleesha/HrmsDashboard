import { httpService } from "@/lib/http/http.service";
import { API_ENDPOINTS } from "@/lib/apiEndpoint";
import type { Holiday, HolidayPayload, HolidayType } from "@/types/holiday";

/**
 * Holiday calendar service — wired to the real HRMS backend's Admin >
 * Holidays API (see the "HRMS API" Postman collection). Simple CRUD
 * (holidays.* permissions); sorted by date ascending, ?year= optionally
 * narrows the list to a calendar year.
 */

interface HolidayRaw {
  id?: string;
  _id?: string;
  name: string;
  date: string;
  type?: string;
  description?: string;
}

function mapHoliday(raw: HolidayRaw): Holiday {
  const type = raw.type as HolidayType;
  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name,
    date: raw.date,
    type: type === "restricted" || type === "optional" ? type : "public",
    description: raw.description ?? "",
  };
}

export async function listHolidays(year?: string): Promise<Holiday[]> {
  const data = await httpService.get<{ holidays?: HolidayRaw[] } | HolidayRaw[]>(
    API_ENDPOINTS.admin.holidays,
    year ? { year } : undefined
  );
  const holidays = Array.isArray(data) ? data : (data.holidays ?? []);
  return holidays.map(mapHoliday).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function createHoliday(payload: HolidayPayload): Promise<Holiday> {
  const data = await httpService.post<{ holiday?: HolidayRaw } | HolidayRaw>(API_ENDPOINTS.admin.holidays, payload);
  const holiday = "holiday" in data && data.holiday ? data.holiday : (data as HolidayRaw);
  return mapHoliday(holiday);
}

export async function updateHoliday(id: string, payload: Partial<HolidayPayload>): Promise<Holiday> {
  const data = await httpService.patch<{ holiday?: HolidayRaw } | HolidayRaw>(
    API_ENDPOINTS.admin.holidayById(id),
    payload
  );
  const holiday = "holiday" in data && data.holiday ? data.holiday : (data as HolidayRaw);
  return mapHoliday(holiday);
}

export async function deleteHoliday(id: string): Promise<void> {
  await httpService.delete<{ message?: string }>(API_ENDPOINTS.admin.holidayById(id));
}
