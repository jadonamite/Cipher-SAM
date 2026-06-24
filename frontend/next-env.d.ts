// frontend/utils.ts
export function checkFileEdit(file: string): string {
  if (file === 'next-env.d.ts') {
    return 'WARNING: This file should not be edited. See https://nextjs.org/docs/app/api-reference/config/typescript for more information.';
  }
  return '';
}
// frontend/next-env.d.ts remains the same
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes.d.ts";
// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.