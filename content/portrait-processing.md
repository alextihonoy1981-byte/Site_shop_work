# Обработка портрета и новый стиль

> Архив отменённой концепции. По последнему поручению владельца фотографий на сайте больше нет; исходный и обработанный портреты удалены из site/public. Актуальная версия: expert-group.md. Приведённые ниже пути описывают предыдущую версию, не действующие файлы сайта.

2 ноября 2026. Владелец отклонил арочное оформление и прислал новый референс: тёмный синий фон, голубое свечение, золотистая типографика и кнопки. Дополнительно поручил зеркально отразить фотографию.

## Результат
Портрет без фона: site/public/alexander-tikhonov-cutout.png (1072 × 1467, RGBA, прозрачность проверена). Исходная фотография сохранена отдельно. Отражение реализовано только для изображения: CSS transform: scaleX(-1). Подпись и интерфейс не отражаются. Нижний и боковые края плавно растворяются в фоне средствами CSS.

## Инструмент
Встроенный ImageGen; CLI/API не использовался. Удаление фона и восстановление деталей выполнены генеративной обработкой исходной фотографии. Это обработанный вариант, а не побитовое сохранение исходных пикселей лица.

## Финальный промпт
Use case: background-extraction. Edit target: the attached original portrait of Alexander. Create a clean transparent-background cutout for his consulting website. Remove ONLY the gray background. Preserve this exact real man's face, age, expression, glasses, hairstyle, skin, white pale-blue shirt, pose and original shoulder/chest framing. Do not beautify or invent a new face, body, clothes, or hands. Preserve natural photographic detail; gently recover clarity from the small source without artificial retouching. Output a portrait-oriented PNG with genuine alpha transparency, no shadows, no background, no frame, no arch, no text. Include his existing shoulders and chest up to the original lower crop. The image will sit on a dark navy website; clean natural hair and shirt edges.
