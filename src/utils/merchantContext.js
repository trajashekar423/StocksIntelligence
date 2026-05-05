import { getToken, getUser } from './authStorage';

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

function readFirstId(collection) {
  if (!Array.isArray(collection) || collection.length === 0) return undefined;
  const first = collection[0];
  return typeof first === 'object' && first !== null ? first.id ?? first.business_id : first;
}

function decodeTokenPayload() {
  const token = getToken();
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getMerchantContext(user = getUser()) {
  const tokenPayload = decodeTokenPayload();

  const businessId = firstDefined(
    user?.business_id,
    user?.businessId,
    user?.business?.id,
    user?.selected_business?.id,
    user?.selectedBusiness?.id,
    user?.merchant?.business_id,
    user?.merchant?.businessId,
    user?.merchant?.business?.id,
    user?.client?.business_id,
    user?.client?.business?.id,
    readFirstId(user?.businesses),
    tokenPayload?.business_id,
    tokenPayload?.businessId,
    tokenPayload?.business?.id,
    tokenPayload?.merchant?.business_id
  );

  const programId = firstDefined(
    user?.program_id,
    user?.programId,
    user?.loyalty_program_id,
    user?.loyaltyProgramId,
    user?.program?.id,
    user?.loyalty_program?.id,
    user?.loyaltyProgram?.id,
    user?.merchant?.program_id,
    user?.merchant?.programId,
    user?.merchant?.loyalty_program_id,
    user?.client?.program_id,
    user?.client?.loyalty_program_id,
    user?.business?.program_id,
    user?.business?.loyalty_program_id,
    user?.selected_business?.program_id,
    user?.selectedBusiness?.program_id,
    readFirstId(user?.programs),
    readFirstId(user?.loyalty_programs),
    tokenPayload?.program_id,
    tokenPayload?.programId,
    tokenPayload?.loyalty_program_id,
    tokenPayload?.loyaltyProgramId,
    tokenPayload?.program?.id,
    tokenPayload?.merchant?.program_id
  );

  return { businessId, programId };
}
