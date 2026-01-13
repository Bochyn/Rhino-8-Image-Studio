Dzisiaj chciałbgym aby ekran startowy aplikacji zawiwerał My Projects w którym będą moje wsyzstkie (sesje). Zmieniamy nazwę z sesji na project. I dodatkowo ma być możliwość wejścia w "Generations" gdzie będzie historia generacji. 

JAk wchodzę w project po lewej chcę mieć tylko viewport caputre to file bez resoltuion i ar. Logika musi być taka, że restolution jest zależne od modelu AI który wybierzemy bo kazdy model wspiera rózny input. Czyli zostaje po prostu to viewport caputre i display mode. 

Po proawej zaś ma być wybór modelu i w zależności od modelu mają pojawiać sie opcje ponieważ każdy model ma inne inputy. Niech domyślny na ten moment będzie nano banaa pro. https://fal.ai/models/fal-ai/nano-banana/edit Z takimi inputami jak opisane tutaj https://fal.ai/models/fal-ai/nano-banana/edit/api w karcie modelu. W ustawieniach pod modelem ma być resolution które wynika z dokumentacji i AR które wynika z dokumentacji i karty modelu. Miejsce na prompt oraz możłiwość dodania dodatkowego reference jeśli karat modelu pozwla na więcej niż jeden. 

Dla refine domyślnym też niech będzie nano banana edit. Dla multiple angle https://fal.ai/models/fal-ai/qwen-image-edit-2511-multiple-angles a dla upscale https://fal.ai/models/fal-ai/topaz/upscale/image z jego dostępnymi inputami. Chodzi o to, że te zakładki Generate Refine Multi Agnle i Upscale musza być zależne od wybranego modelu dla danej zakładki. Niech UI podaje informację, z tym jaki model jest obecnie wybrany.  

Do zrobienia

PRzeede wszystki lekka przebudowa UI z tego co opisałem u góry. 
1. Generacja AI (KLUCZOWE)
Integracja z fal.ai API
Wysyłanie capture + prompt do modelu https://fal.ai/models/fal-ai/nano-banana/edit
Odbieranie wygenerowanego obrazu
Wyświetlanie wyniku w UI
2. Konfiguracja API Key
UI do wpisania klucza fal.ai
Zapisywanie w bezpiecznym storage (DPAPI)
Walidacja klucza
3. Refinement (Refine)
Iteracja nad wygenerowanym obrazem
"Popraw ten obraz z nowym promptem"
4. Multi-Angle Generation
Generacja spójnych widoków pod różnymi kątami
Model: https://fal.ai/models/fal-ai/qwen-image-edit-2511-multiple-angles
5. Upscaling
Powiększanie obrazów do wyższej rozdzielczości
Model: https://fal.ai/models/fal-ai/topaz/upscale/image
6. Export
Zapisywanie obrazów na dysk
Wybór formatu (PNG, JPEG, WebP)