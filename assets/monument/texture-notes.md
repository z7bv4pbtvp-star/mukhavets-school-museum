# Фактуры памятника

В текущей версии v3 плитка и цветы построены геометрией. Используется только `soil-v2.webp` из набора v2; исходные PNG и прежние изображения плитки и хризантемы не нужны для сайта. `granite-grain.jpg` — синтетический аналог мелкозернистого гранита для непрерывного наложения в мировом масштабе.

# Фактуры площадки и клумбы, v2

Созданы встроенным image_gen (не CLI) для этой локальной версии. Исходные фотографии памятника и табличек не генерировались и не заменялись.

- `paving-v2.webp` / `paving-v2.png`: серая бетонная интерлоковая плитка; рабочая WebP около 0,73 МБ.
- `soil-v2.webp` / `soil-v2.png`: тёмная садовая земля; рабочая WebP около 0,89 МБ.
- `chrysanthemum-v2.webp` / `chrysanthemum-v2.png`: хризантема с прозрачностью, около 0,40 МБ; белые лепестки окрашиваются в шейдере в жёлтый и бордовый, листья сохраняют свой цвет.

Промпт плитки: "Photorealistic physically plausible aged grey concrete interlocking I-shaped paver surface, exactly overhead orthographic flat 2D material scan, seamless tile. A regular nested interlocking double-T dogbone pavement pattern, not rectangles, not brick wall. Show about 7 interlocking pavers across and 9 rows in square image, plausible stone-to-stone variation in neutral medium grey with subtle olive weathering and tiny moss inside narrow 3mm joints. Concrete fine pores and restrained tiny worn edges, rough matte natural surface. Soft completely diffuse uniform lighting, zero cast shadows, zero perspective, no directional highlights, no leaves, no plants, no objects, no borders, no text, no watermark. Premium PBR game material albedo, high clarity close up, square image 1024 or larger. Overall restrained mid-grey, not white, not aggressively dirty, not glossy."

Промпт растения: "One single low dense round cushion chrysanthemum plant, an actual autumn garden mum shrub about 35cm wide and 22cm high, covered in many small densely layered pale ivory white chrysanthemum flowers, dark natural green small foliage around the base and between the flowers. Photorealistic botanical detail, believable petals and plant structure, small imperfections. Three-quarter low viewing angle looking slightly down at shrub, entire plant visible and centered, tight square composition with thin transparent padding. Truly transparent background around all outer leaves/petals, no pot, no soil, no ground plane, no cast shadow around it, no text, no other objects, no collaged angles. Even soft overcast light, neutral exposure, botanical photographic scan cutout. White petals will be tinted in the renderer to natural golden and burgundy garden chrysanthemum colors."

Промпт земли: "Photorealistic fine natural cultivated dark grey-brown moist garden soil viewed directly overhead orthographic, entire image filled with soil only, subtle small clods, very tiny grains and a few fine dry roots, mostly fine smooth earth texture, no large stones, no greenery, no flowers, no leaves, no twigs, no borders, no text. Uniform diffuse overcast lighting, no cast shadows, no perspective, no directional light. Tileable square texture, natural understated dark umber and grey, no orange/red. Fine believable microtexture that remains calm when tiled. High quality material scan, 1024 square or larger."
