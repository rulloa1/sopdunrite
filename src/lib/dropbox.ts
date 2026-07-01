/**
 * Dropbox API integration for DunRite SOP (production app).
 *
 * Configuration — add to your server environment:
 *   DROPBOX_ACCESS_TOKEN=your_token_here
 *
 * Generate a long-lived access token at:
 *   https://www.dropbox.com/developers/apps
 *   App Console → Your App → Settings → OAuth 2 → Generated access token
 *
 * Client-side (browser) calls also need:
 *   VITE_DROPBOX_ACCESS_TOKEN=your_token_here
 *
 * All project documents are stored under:
 *   /DunRite/ProjectDocuments/{projectId}/{filename}
 */

const DROPBOX_API = "https://api.dropboxapi.com/2";
const DROPBOX_CONTENT_API = "https://content.dropboxapi.com/2";
export const DROPBOX_BASE_FOLDER = "/DunRite/ProjectDocuments";

/** Resolve the access token from either server or client environment. */
export function getDropboxToken(): string {
  // Server-side (TanStack Start / Node)
  if (typeof process !== "undefined" && process.env?.DROPBOX_ACCESS_TOKEN) {
    return process.env.DROPBOX_ACCESS_TOKEN;
  }
  // Client-side (Vite)
  const viteToken =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_DROPBOX_ACCESS_TOKEN as string | undefined)
      : undefined;
  if (viteToken && viteToken !== "sl.u.AGlTQD3xcgjQsUpPeKcLa9GiEK2BegRrTOI27mq27susRWv94T1bFA3a2MRVm4m3J4ZGm5r3UJxaIqXGh7IZt2RjmRyeOI2gud2D0oW9UHIouLXJA2ljxvfZemgfeCl_9BlbioTheHWzjU6Ajp7_-fSdnHgDCOqMXkT6fch1pV7y7sh38jTFSZ_63MdmA80o7oMU7ugwkHE_BkOuDGIJiO44YY4dJcMQtJvk7idBEzFFLLvAsb1zIVjlEvbSOmaTRrbwCKxTaZFE0LwJ523F7Umi7E0r5RIsu7Rlr_EEFUW28UoEN5EJjGFHUB2Yf0QBHyoc2NiTQWmFoFCXJSmdR7YpTJno_lSN9UMua4QghR1ORfhAF78sfJtEwkW6LKs_zk3kpHD8xx4XynjI7uhdMHoNqFH2kwKRjdCDimQDR8IZg3lD1_CpRR9_29NMROBsaE08PkWRCx2rP62Gt8jEu5DqB9m2R9NxKRhyjVNotSCqL8TVj7pwKYd_E9jzGNDZwAsLIUlW-3eHKbqA8g1PYraaOTdT7Xvu7zKQxeMqQGJW8dmQcydkh92kIlRfIDQrsFqaNVETlIl0otkgTkCLQ_C6k1mYvc8na4AvNGjTHh-4sy3TJIexj20CvoWnxrHdlhzIlCTFJAMGIIe7kmUPMiUTGs6_e86w44tDhaBJI6yj2WjLXHxbZRUZLVXQykpgphHt4jJTebJUoA54620O6njD_6tCDhxg6P0Zel_H3LEFljepm88VnvFdt1B5ODa8ABCqBE24dx6igquxWVSZZXidaSnZyQR7HDUC-H3N-RwAgK1G4dpLa915DDhiPshBEIa1xUVwymzO2sCwNXYa-Urau2JDY5mur3iVlIlRDXUE_6LORPM-vUge7juZW6arxJUdTmSR44XUaMtag10nXmiXdV53iIktmCKFjdpOHxfqo1dVQylzP80S9SjPr8o_WAeVfovItSp0g6z8lT5l0MYobBuDOcKFeicgGW7OHk-8PtxJWpjmc4z1_DuKac9udwsg3hUyAU6RvDQOKB74660RmUSJakOa_S-_pR0qcb4GfgMDslOh3dGdsvLWopTaRM3jcYcQUsiTSVQVIZ9NbGo_2gkOUHoiEXGK893RG2ZWzo3dNUNJb9JsPc1ICCaLnuYAGbX31k2He9D75EAFIEsxXf3lLGCOmLXYHllYeR4ICS6hPXvnKHllL27OZJAINhBMZJ03wYL9ZRV5omr-f_Z5dBy31QDfBahlR8B26cnA9G4-eV8FVQzy3uDFCYDLAZRwD5RB3CGl2vYMKpvhQL1NrRcnjQiktUBor1aikzMHE1sA2wJ0qBJd1xKEi__Ga6k") {
    return viteToken;
  }
  throw new Error(
    "Dropbox is not configured. Set DROPBOX_ACCESS_TOKEN (server) or VITE_DROPBOX_ACCESS_TOKEN (client) in your environment.",
  );
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export interface DropboxFile {
  id: string;
  name: string;
  path_lower: string;
  size: number;
  server_modified: string;
  client_modified: string;
}

/** List all files for a given project folder. */
export async function listDropboxFiles(projectId: string): Promise<DropboxFile[]> {
  const token = getDropboxToken();
  const folderPath = `${DROPBOX_BASE_FOLDER}/${projectId}`;
  await ensureDropboxFolder(folderPath, token);

  const res = await fetch(`${DROPBOX_API}/files/list_folder`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ path: folderPath, recursive: false }),
  });

  if (res.status === 409) return [];

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error_summary ?? `Dropbox list failed (${res.status})`);
  }

  const data = (await res.json()) as { entries?: Record<string, unknown>[] };
  return (data.entries ?? []).filter((e) => e[".tag"] === "file") as unknown as DropboxFile[];
}

/** Upload a file (browser File or Node Buffer/Blob) to Dropbox. */
export async function uploadToDropbox(
  projectId: string,
  fileName: string,
  body: File | Blob | ArrayBuffer,
  token?: string,
): Promise<DropboxFile> {
  const tok = token ?? getDropboxToken();
  const destPath = `${DROPBOX_BASE_FOLDER}/${projectId}/${fileName}`;

  const res = await fetch(`${DROPBOX_CONTENT_API}/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tok}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path: destPath,
        mode: "add",
        autorename: true,
        mute: false,
      }),
    },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error_summary ?? `Dropbox upload failed (${res.status})`);
  }

  return res.json() as Promise<DropboxFile>;
}

/** Get a temporary download link (valid ~4 hours) for a Dropbox path. */
export async function getDropboxDownloadUrl(pathLower: string, token?: string): Promise<string> {
  const tok = token ?? getDropboxToken();
  const res = await fetch(`${DROPBOX_API}/files/get_temporary_link`, {
    method: "POST",
    headers: authHeaders(tok),
    body: JSON.stringify({ path: pathLower }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error_summary ?? `Dropbox link failed (${res.status})`);
  }

  const data = await res.json();
  return data.link as string;
}

/** Delete a file from Dropbox by its path. */
export async function deleteFromDropbox(pathLower: string, token?: string): Promise<void> {
  const tok = token ?? getDropboxToken();
  const res = await fetch(`${DROPBOX_API}/files/delete_v2`, {
    method: "POST",
    headers: authHeaders(tok),
    body: JSON.stringify({ path: pathLower }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error_summary ?? `Dropbox delete failed (${res.status})`);
  }
}

/** Silently ensure a Dropbox folder exists. */
async function ensureDropboxFolder(path: string, token: string): Promise<void> {
  const res = await fetch(`${DROPBOX_API}/files/create_folder_v2`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ path, autorename: false }),
  });
  if (!res.ok && res.status !== 409) {
    const body = await res.json().catch(() => ({}));
    if (!body?.error_summary?.includes("path/conflict")) {
      throw new Error(body?.error_summary ?? `Could not create Dropbox folder (${res.status})`);
    }
  }
}
