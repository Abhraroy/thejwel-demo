import { createClient } from "@/lib/supabase-Utils/client";

const DEFAULT_SHARE_MESSAGES = [
  "Just found this beauty 💎✨ Check out {productName} on TheJwel – obsessed!",
  "This {productName} is everything 🔗 TheJwel has me hooked",
  "The way this piece hits different 🌿💛 {productName} – TheJwel",
  "Can we talk about this? {productName} from TheJwel is giving main character energy",
  "Found my new obsession 💚 This {productName} on TheJwel is *chef's kiss*",
];

const DEFAULT_CLOSING_LINES = [
  "✨ Shop Now & Own Your Moment",
  "💎 Limited Pieces, Timeless Style",
  "🛍️ Discover More at TheJwel",
  "💚 Your Style. Your Story. TheJwel.",
  "🌟 Express Yourself – Shop TheJwel",
];

function pickRandom(items: string[], exclude?: string): string {
  const pool =
    exclude && items.length > 1
      ? items.filter((item) => item !== exclude)
      : items;
  const choices = pool.length > 0 ? pool : items;
  return choices[Math.floor(Math.random() * choices.length)];
}

async function getShareLinkContent(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("promo_content")
    .select("content")
    .eq("place_to_be_displayed", "share_link")
    .order("created_at", { ascending: true });

  if (error || !data?.length) {
    return [];
  }

  return data.map((item) => item.content);
}

export async function shareProduct(product: any) {
  const shareLinkContent = await getShareLinkContent();
  const shareMessages =
    shareLinkContent.length > 0 ? shareLinkContent : DEFAULT_SHARE_MESSAGES;
  const closingLines =
    shareLinkContent.length > 0 ? shareLinkContent : DEFAULT_CLOSING_LINES;

  const randomMessage = pickRandom(shareMessages);
  const randomClosingLine = pickRandom(closingLines, randomMessage);
  const shareText = randomMessage.replace("{productName}", product.product_name);
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/product/${product.product_id}`;
  const shareData = {
    title: product.product_name,
    text: `${shareText} | ${randomClosingLine}`,
    url: shareUrl,
  };

  try {
    if (navigator.share) {
      if (
        navigator.canShare &&
        !navigator.canShare({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        })
      ) {
        throw new Error("Share data not supported");
      }

      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
    return { success: true, error: null };
  } catch (error) {
    console.error("Error sharing product:", error);
    return { success: false, error: error as string };
  }
}
