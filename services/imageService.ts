
function detectHeroSubject(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('chaga')) return 'a dramatic raw chaga mushroom specimen with dark charred exterior and rich amber interior, placed on a minimal white cylindrical pedestal';
  if (t.includes("lion's mane") || t.includes('lions mane') || t.includes('lion mane')) return "a fresh lion's mane mushroom with cascading white icicle-like tendrils, placed on a minimal white cylindrical pedestal";
  if (t.includes('reishi')) return 'a glossy lacquered reishi mushroom with deep reddish-brown cap, placed on a minimal white cylindrical pedestal';
  if (t.includes('tremella')) return 'a delicate cloud-like tremella mushroom cluster, pale gold and translucent, placed on a minimal white cylindrical pedestal';
  if (t.includes('cordyceps')) return 'dried cordyceps militaris mushrooms with vibrant orange color, placed on a minimal white cylindrical pedestal';
  if (t.includes('koffie') || t.includes('coffee')) return 'a minimal matte black ceramic cup filled with dark mushroom coffee, placed on a white cylindrical pedestal, steam rising';
  if (t.includes('matcha')) return 'a traditional ceramic matcha bowl with vibrant green powder and a bamboo whisk, placed on a minimal white pedestal';
  if (t.includes('cacao')) return 'raw cacao pods split open with dark nibs, accompanied by dried mushroom pieces, arranged on a minimal white pedestal';
  if (t.includes('slaap') || t.includes('sleep')) return 'dried reishi mushroom slices with calming botanical elements, placed on a minimal white cylindrical pedestal';
  if (t.includes('focus') || t.includes('concentratie') || t.includes('brein')) return "a lion's mane mushroom specimen with cascading white tendrils, placed on a minimal white cylindrical pedestal";
  if (t.includes('stress') || t.includes('adaptogen')) return 'a collection of adaptogenic mushroom roots and dried reishi slices, arranged on a minimal white cylindrical pedestal';
  if (t.includes('immuun') || t.includes('immune')) return 'chaga and reishi mushroom specimens together, placed on a minimal white cylindrical pedestal';
  if (t.includes('energie') || t.includes('energy')) return 'cordyceps mushrooms with raw coffee beans, arranged on a minimal white cylindrical pedestal';
  return 'dried functional mushroom specimens arranged on a minimal white cylindrical pedestal';
}

function buildHeroPrompt(title: string): { prompt: string; size: string } {
  const subject = detectHeroSubject(title);
  return {
    size: '1536x1024',
    prompt: `Hyperrealistic studio product photography composed for a wide 16:9 landscape banner. ${subject}. Warm neutral beige-grey background with a soft gradient. Dramatic directional studio lighting from the right side. The subject is placed in the right half of the frame — the left 40% of the image is intentionally open negative space with only the background, leaving room for a text overlay. Wide cinematic crop, nothing important near the top or bottom edges. Ultra-sharp detail. Premium editorial photography for a Scandinavian wellness brand. CRITICAL: absolutely no text, no letters, no words, no writing, no numbers, no labels anywhere in the image. No people, no hands, no logos, no watermarks.`,
  };
}

async function generateSingleImage(prompt: string, size: string): Promise<string> {
  const response = await fetch('/api/openai-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, size }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || response.statusText);
  }

  const { b64_json } = await response.json();
  return `data:image/png;base64,${b64_json}`;
}

export async function generateBlogImages(
  title: string,
  _body: string,
  onProgress?: (index: number, dataUrl: string) => void
): Promise<string[]> {
  const config = buildHeroPrompt(title);
  const dataUrl = await generateSingleImage(config.prompt, config.size);
  onProgress?.(0, dataUrl);
  return [dataUrl];
}
