import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request, { params }: { params: { bookId: string } }) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang");

  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", params.bookId)
    .single();

  const { data: langs } = await supabase
    .from("book_languages")
    .select("language_id, languages(name)")
    .eq("book_uuid", params.bookId)
    .leftJoin("languages", "languages.id", "book_languages.language_id");

  const { data: categories } = await supabase
    .from("book_categories")
    .select("categories(name)")
    .eq("book_id", params.bookId)
    .leftJoin("categories", "categories.id", "book_categories.category_id");

  const { data: content } = await supabase
    .from("book_content")
    .select("*")
    .eq("book_id", params.bookId)
    .eq("language_id", lang)
    .single();

  return NextResponse.json({
    ...book,
    pdf_url: content?.pdf_url || null,
    epub_url: content?.epub_url || null,
    categories: categories?.map((c: any) => c.categories.name) || [],
    available_languages:
      langs?.map((l: any) => ({ id: l.language_id, name: l.languages.name })) || [],
  });
}
