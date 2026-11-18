import { getCurrentUser } from "./authProvider.js";
import { requireSupabase } from "./supabaseClient.js";

const TABLE = "user_books";

function _userId() {
  const user = getCurrentUser();
  if (!user?.id) throw new Error("Sign in to access your books.");
  return user.id;
}

function _fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    progress: row.progress,
    modifiedAt: Date.parse(row.modified_at) || Date.now(),
    course: row.course,
  };
}

export async function listUserBooks() {
  const userId = _userId();
  const { data, error } = await requireSupabase()
    .from(TABLE)
    .select("id, name, progress, modified_at, course")
    .eq("user_id", userId)
    .order("modified_at", { ascending: false });

  if (error) throw error;
  return data.map(_fromRow);
}

export async function saveUserBook(book) {
  const userId = _userId();
  if (!book?.id || !book?.name || !book?.course) {
    throw new Error("A book must have an ID, name, and course content.");
  }

  const row = {
    id: book.id,
    user_id: userId,
    name: book.name,
    progress: Math.max(0, Math.min(100, Number(book.progress) || 0)),
    modified_at: new Date(book.modifiedAt || Date.now()).toISOString(),
    course: book.course,
  };
  const { data, error } = await requireSupabase()
    .from(TABLE)
    .upsert(row, { onConflict: "id" })
    .select("id, name, progress, modified_at, course")
    .single();

  if (error) throw error;
  return _fromRow(data);
}

export async function deleteUserBooks(ids) {
  if (!ids.length) return;
  const userId = _userId();
  const { error } = await requireSupabase()
    .from(TABLE)
    .delete()
    .eq("user_id", userId)
    .in("id", ids);

  if (error) throw error;
}
