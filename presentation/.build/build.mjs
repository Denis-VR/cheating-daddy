import fs from 'node:fs/promises';
import path from 'node:path';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
import {finalizePresentation,resolvePresentationFont,applyPresentationChartFont} from '/Users/denisriabhcikov/.codex/plugins/cache/openai-primary-runtime/presentations/26.915.20218/skills/presentations/container_tools/artifact_tool_utils.mjs';
const dir=path.dirname(new URL(import.meta.url).pathname), workspace=path.dirname(dir);
const SKILL='/Users/denisriabhcikov/.codex/plugins/cache/openai-primary-runtime/presentations/26.915.20218/skills/presentations';
const PY='/Users/denisriabhcikov/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const FONT=resolvePresentationFont({fontFamily:'Arial'});
const P=Presentation.create({slideSize:{width:1280,height:720}});
const C={ink:'#102D36',dark:'#091C23',cream:'#F4F3ED',white:'#FAFCFA',mint:'#76E5CC',teal:'#127663',muted:'#64787D',pale:'#DCEAE4',coral:'#EC916F'};
let count=0;
function txt(s,text,x,y,w,h,size=26,color=C.ink,bold=false){const a=s.shapes.add({geometry:'textbox',name:`text-${s.id}-${s.shapes.items?.length||Math.random()}`,position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=text;a.text.style={typeface:FONT,fontSize:size,color,bold,autoFit:'none',verticalAlignment:'top',insets:{left:0,right:0,top:0,bottom:0}};return a;}
function slide(title,{dark=false,note=''}={}){const s=P.slides.add();s.background.fill=dark?C.dark:C.cream;count++; if(title)txt(s,title,64,54,1152,108,48,dark?C.white:C.ink,true);txt(s,String(count).padStart(2,'0'),1160,665,56,25,16,dark?'#98ADA9':C.muted);s.speakerNotes.textFrame.setText(note);return s;}
function label(s,t,x,y,w=500,dark=false){return txt(s,t,x,y,w,32,17,dark?C.mint:C.teal,true);}
function body(s,t,x,y,w=500,h=140,dark=false,size=26){return txt(s,t,x,y,w,h,size,dark?'#B9CFCC':C.muted);}
function node(s,t,x,y,w=250,h=84,{dark=false,accent=false,size=25}={}){let a=s.shapes.add({geometry:'roundRect',position:{left:x,top:y,width:w,height:h},fill:accent?(dark?C.mint:C.teal):(dark?'#183740':C.pale),line:{fill:'none',width:0},borderRadius:12});a.text=t;a.text.style={typeface:FONT,fontSize:size,color:accent?(dark?C.dark:C.white):(dark?C.white:C.ink),bold:true,alignment:'center',verticalAlignment:'middle',insets:{left:16,right:16,top:8,bottom:8},autoFit:'none'};return a;}
function link(s,a,b,from='right',to='left',dark=false){return s.shapes.connect(a,b,{kind:'straight',fromSide:from,toSide:to,line:{fill:dark?C.mint:C.teal,width:2},tail:{type:'arrow',width:'med',length:'med'}});}
function source(paths,extra=''){return 'Источник: текущий локальный проект Cheating Daddy, 23.09.2026. '+paths+'. '+extra;}
// 1
{
const s=slide('',{dark:true,note:'Обложка: оригинальная декоративная иллюстрация, созданная с Imagegen. Обзор текущей версии локального приложения.'});
s.images.add({blob:await fs.readFile(path.join(dir,'assets/cover.png')),contentType:'image/png',position:{left:0,top:0,width:1280,height:720},fit:'cover'});
label(s,'AI-АССИСТЕНТ ДЛЯ ТЕХНИЧЕСКИХ РАЗГОВОРОВ',64,66,750,true);
txt(s,'Cheating\nDaddy',64,210,700,216,96,C.white,true);
body(s,'Вопросы, контекст и ответы\nв удобном темпе разговора',68,483,640,112,true,32);
txt(s,'Обзор возможностей приложения',68,649,700,32,20,'#B9CFCC');
}
// 2
{
const s=slide('Ответ остаётся перед глазами',{note:source('src/components/app/CheatingDaddyApp.js; src/components/views/AssistantView.js','Схема иллюстрирует поведение интерфейса, а не измерение времени.')});
body(s,'Собеседник продолжает говорить.\nВы спокойно дочитываете текущий ответ.',64,169,1050,88,false,30);
label(s,'РАЗГОВОР',64,301,190);label(s,'ВАШ ЭКРАН',64,456,190);
const a=node(s,'Вопрос про Go',277,290,264,75), b=node(s,'Уточнение',591,290,264,75),c=node(s,'Вопрос про Kafka',905,290,300,75);link(s,a,b);link(s,b,c);
const r=node(s,'Текущий ответ остаётся выбранным',277,440,578,95,{accent:true});const q=node(s,'Новые вопросы\nждут в очереди',905,440,300,95);link(s,r,q);
body(s,'Пауза останавливает обработку нового аудио. Текстовые вопросы и скриншоты остаются доступны.',277,566,900,75,false,24);
}
// 3
{
const s=slide('Один рабочий цикл',{dark:true,note:source('src/components/views/InterviewTools.js; src/components/views/SessionConsole.js; src/components/views/HistoryView.js')});
const cols=[{n:'01',x:64,t:'До разговора',b:'Материалы вакансии\nПрофиль инструкций\nПроверка готовности'},{n:'02',x:480,t:'Во время',b:'Распознанные вопросы\nОтветы и уточнения\nКод, скриншоты и схемы'},{n:'03',x:896,t:'После',b:'Сохранённая история\nТемы для перепроверки\nПлан повторения'}];
for(const c of cols){txt(s,c.n,c.x,230,250,120,100,C.mint,true);txt(s,c.t,c.x,370,330,50,34,C.white,true);body(s,c.b,c.x,447,340,158,true,25);}
}
// 4
{
const s=slide('Из реплик получается вопрос',{note:source('src/utils/interview-workflow.js; src/components/views/InterviewTools.js','Объединение реплик использует эвристики и временное окно. Пользователь проверяет и исправляет черновик.')});
const a=node(s,'«Расскажи про индексы…»',64,203,480,84),b=node(s,'«…и почему PostgreSQL\nиногда их не использует?»',64,331,480,104);
const c=node(s,'Один редактируемый вопрос',650,266,550,109,{accent:true});link(s,a,c);link(s,b,c);
body(s,'Связанные реплики собираются вместе.\nКороткие подтверждения вроде «угу»\nи «понятно» не запускают ответ.',64,491,523,123,false,26);
txt(s,'Вы выбираете момент ответа',650,460,550,46,30,C.ink,true);body(s,'Проверьте формулировку, поправьте текст\nи подтвердите отправку модели.',650,521,550,100,false,26);
}
// 5
{
const s=slide('Интерфейс для чтения',{dark:true,note:source('src/components/views/AssistantView.js','Снимок реального компонента приложения в браузерном стенде. Демонстрационный текст ответа, не реальный диалог пользователя.')});
s.images.add({blob:await fs.readFile(path.join(dir,'assets/answer.png')),contentType:'image/png',position:{left:64,top:180,width:745,height:482},fit:'contain'});
txt(s,'Крупный ответ',854,196,350,48,32,C.white,true);body(s,'Режим «Только ответ»\nскрывает служебные панели.',854,254,353,90,true,25);
txt(s,'Текст под вас',854,378,350,48,32,C.white,true);body(s,'A− и A+ меняют шрифт.\nКод получает подсветку,\nтаблицы сохраняют структуру.\nЕсть горячие клавиши.',854,435,353,169,true,25);
txt(s,'Интерфейс с демонстрационным ответом',64,651,700,28,16,'#97AEAB');
}
// Answer depth
{
const s=slide('Глубина ответа под ситуацию',{note:source('src/utils/interview-workflow.js; src/components/views/InterviewTools.js','Формат задаётся инструкцией модели. Пример ниже объясняет структуру, а не является снимком интерфейса.')});
const rows=[['01','Короткий ответ','Главная мысль в нескольких предложениях.'],['02','Объяснение','Логика решения, отличия и важные условия.'],['03','Подробности','Пример, ограничения и детали реализации.']];
rows.forEach((r,i)=>{const y=206+i*119;txt(s,r[0],64,y,94,58,43,C.teal,true);txt(s,r[1],198,y,400,49,33,C.ink,true);body(s,r[2],645,y+4,570,92,false,27);});
label(s,'БЫСТРЫЕ УТОЧНЕНИЯ',64,594,560);
txt(s,'«Короче»     «Пример на Go»     «Почему?»     «Сравнить»',64,638,1147,43,25,C.ink,true);
}
// 6
{
const s=slide('Уточнения сохраняют тему',{note:source('src/components/app/CheatingDaddyApp.js; src/components/views/InterviewTools.js','Автоматическую маршрутизацию можно исправить вручную.')});
const a=node(s,'Каналы Go',64,237,290,94,{accent:true}),b=node(s,'«А если канал закрыт?»',466,201,734,85),c=node(s,'«Почему отправка блокируется?»',466,330,734,85);link(s,a,b);link(s,a,c);
const d=node(s,'Kafka',64,506,290,94,{accent:true}),e=node(s,'Отдельная тема и свои уточнения',466,506,734,94);link(s,d,e);
body(s,'Темы можно объединять, разделять и удалять. Для отдельного запроса есть новая карточка.',64,626,1080,65,false,23);
}
// 7
{
const s=slide('Ответы с учётом вашего опыта',{note:source('src/utils/interview-workflow.js; src/components/views/InterviewTools.js; src/components/views/AICustomizeView.js','Контекст вакансии фиксируется при запуске сессии. Извлечение релевантных фрагментов использует совпадения слов.')});
label(s,'PREPARATION',64,188);txt(s,'Ваши материалы',64,229,505,58,36,C.ink,true);body(s,'Резюме, описание вакансии\nи реальные истории проектов.\nИмпорт PDF с текстом, DOCX, TXT, MD.',64,301,521,140,false,26);
label(s,'AI CUSTOMIZATION',696,188);txt(s,'Ваши инструкции',696,229,520,58,36,C.ink,true);body(s,'Создание, редактирование\nи удаление профилей.\nСтиль и глубина ответа под задачу.',696,301,520,140,false,26);
const a=node(s,'Релевантные фрагменты опыта',64,480,521,85),b=node(s,'Профиль и дополнительные инструкции',696,480,520,85);txt(s,'+',620,491,56,65,42,C.teal,true);
body(s,'Если факта в материалах нет, инструкция просит модель обозначить пробел.\nДостижения и примеры нужно проверять.',64,605,1140,72,false,23);
}
// 8
{
const s=slide('Скриншот вместе с заданием',{dark:true,note:source('src/components/views/InterviewTools.js; src/utils/hosted-ai.js','Стоимость зависит от выбранной OCR/vision-модели и провайдера. Обещания фиксированной экономии нет.')});
body(s,'Вставьте изображение, добавьте свой вопрос и отправьте, когда всё готово.',64,166,1120,78,true,29);
const a=node(s,'Скриншоты\n+ текст запроса',64,319,301,123,{dark:true,accent:true}),b=node(s,'OCR: извлечение текста',488,265,345,90,{dark:true}),c=node(s,'Изображение целиком',488,456,345,90,{dark:true});link(s,a,b,'right','left',true);link(s,a,c,'right','left',true);
body(s,'Для кода и текста.\nРаспознанный текст\nможно исправить.',886,269,328,120,true,25);
body(s,'Для схем и графиков.\nМодель учитывает\nрасположение и связи.',886,459,328,120,true,25);
body(s,'Можно приложить несколько снимков к одному заданию.',64,619,1120,42,true,24);
}
// 9
{
const s=slide('Техническая задача по шагам',{note:source('src/utils/interview-workflow.js; src/utils/code-sandbox.js; src/components/views/InterviewTools.js','Код запускается вручную, при наличии Docker. SQL проверяется в SQLite. Race detector Go не включён.')});
const names=['Что уточнить','Идея решения','Код','Сложность','Крайние случаи','Как объяснить'];let ns=[];
for(let i=0;i<6;i++){const x=64+(i<3?i:5-i)*404,y=212+Math.floor(i/3)*164;ns.push(node(s,names[i],x,y,345,92,{accent:i===2}));if(i%3)link(s,ns[i-1],ns[i],i<3?'right':'left',i<3?'left':'right');}
link(s,ns[2],ns[3],'bottom','top');
txt(s,'Go, Python и SQL',64,565,450,45,32,C.ink,true);body(s,'Ручной запуск кода и тестов в Docker.\nБез сети, с ограничениями ресурсов и времени.',524,561,692,86,false,25);
}
// 10
{
const s=slide('System design с рабочей схемой',{note:source('src/components/views/InterviewTools.js; src/utils/interview-workflow.js','Схема ниже демонстрационная. Реальный редактор поддерживает простые узлы и связи, требования, нагрузку, API, хранилища, решения, изменения и предыдущие версии.')});
body(s,'Требования, нагрузка, API и решения остаются в одном проекте.\nНовое ограничение обновляет текущую архитектуру.',64,165,1110,95,false,28);
const a=node(s,'Клиент',64,346,235,87),b=node(s,'API',386,346,235,87,{accent:true}),c=node(s,'Кэш',716,295,220,87),d=node(s,'Хранилище',716,465,220,87);link(s,a,b);link(s,b,c);link(s,b,d);
label(s,'ПРИМЕР СХЕМЫ',997,313,220);body(s,'Узлы и связи\nпомогают\nобъяснить\nрешение.',997,354,220,161,false,24);
body(s,'Добавьте «нужен multi-region», изучите изменения и при необходимости\nвернитесь к предыдущей версии.',64,600,1152,72,false,24);
}
// 11
{
const s=slide('Готовность и восстановление',{dark:true,note:source('src/utils/session-support.js; src/components/views/SessionConsole.js; src/components/app/CheatingDaddyApp.js','Проверка отражает момент запуска. Сохранение раз в секунду и при обычном закрытии. Повтор запроса может тарифицироваться повторно.')});
label(s,'ПЕРЕД СЕССИЕЙ',64,211,500,true);txt(s,'Проверить готовность',64,253,550,90,39,C.white,true);body(s,'Доступ к модели и время ответа\nЗахват экрана\nПоступление системного звука\nМикрофон, если он выбран',64,366,550,203,true,27);
label(s,'ПРИ СБОЕ',704,211,500,true);txt(s,'Продолжить сессию',704,253,512,90,39,C.white,true);body(s,'Сохранённые темы и черновик\nПоложение чтения\nПовтор конкретного запроса\nПродолжение после перезапуска',704,366,512,203,true,27);
body(s,'Сеть, доступность модели и разрешения macOS проверяются в реальных условиях звонка.',64,633,1100,55,true,21);
}
// 12
{
const s=slide('После разговора остаётся план',{note:source('src/utils/session-support.js; src/components/views/HistoryView.js','Разбор локальный, эвристический. Демонстрационные примеры ниже. Устные ответы пользователя не оцениваются.')});
txt(s,'History',64,216,330,65,52,C.teal,true);body(s,'Сохранённые вопросы\nи ответы. Удаление\nодной истории или всех.',64,302,330,143,false,26);
const a=node(s,'Что вызвало уточнения',492,202,708,75),b=node(s,'Что стоит перепроверить',492,327,708,75),c=node(s,'Что повторить завтра',492,452,708,75);link(s,a,b,'bottom','top');link(s,b,c,'bottom','top');
body(s,'Разбор помогает выбрать темы для повторения.\nОн анализирует историю запросов, а не оценивает ваши устные ответы.',64,600,1120,78,false,25);
}
// 13
{
const s=slide('Выбор модели и контроль данных',{note:source('src/utils/hosted-ai.js; src/storage.js; src/utils/interview-storage.js; docs/INTERVIEW_CHECKLIST_RU.md','Новые режимы сессии рассчитаны на OpenAI и OpenRouter. Gemini/Groq и local существуют как другие режимы, без обещания полного паритета. API оплачивается отдельно.')});
const a=node(s,'Приложение\nна компьютере',64,254,306,129,{accent:true}),b=node(s,'OpenRouter',494,205,298,87),c=node(s,'OpenAI',494,377,298,87),d=node(s,'Выбранная\nмодель ответа',902,273,304,121);link(s,a,b);link(s,a,c);link(s,b,d);link(s,c,d);
body(s,'Локально: настройки,\nматериалы и история.',64,512,350,100,false,25);
body(s,'В выбранный сервис уходят данные\nдля обработки: текст, аудио\nи отправленные изображения.',494,512,690,123,false,25);
body(s,'Новые режимы работают с OpenAI и OpenRouter. Использование API оплачивается отдельно.',64,648,1140,38,false,20);
}
// 14
{
const s=slide('Проверки ключевых сценариев',{note:source('tests/*.test.js; presentation/.build/tests.txt','54 теста прошли 23.09.2026. Группы: reading-position 21, hosted-ai 13, interview-workflow 6, остальные 14. Это количество автоматических сценариев, не процент покрытия и не гарантия отсутствия ошибок.')});
txt(s,'54',64,217,310,156,126,C.teal,true);txt(s,'автоматических теста\nпрошли проверку',68,389,350,110,30,C.ink,true);
const ch=s.charts.add('bar',{position:{left:438,top:193,width:774,height:379},categories:['Чтение и интерфейс','AI и аудио','Вопросы и контекст','Остальные сценарии'],series:[{name:'Пройденные тесты',values:[21,13,6,14],fill:C.teal}],barOptions:{direction:'bar',grouping:'clustered',gapWidth:65},hasLegend:false,chartFill:C.cream,plotAreaFill:C.cream,xAxis:{visible:false,majorGridlines:null},yAxis:{textStyle:{fontSize:22,fill:C.ink,typeface:FONT},line:{fill:'none',width:0},majorGridlines:null},dataLabels:{showValue:true,position:'outEnd',textStyle:{fontSize:24,fill:C.ink,bold:true,typeface:FONT}}});applyPresentationChartFont(ch,{fontFamily:FONT});
body(s,'Проверка от 23 сентября 2026. Автотесты дополняют репетицию звонка:\nзвук, разрешения и доступ к API зависят от компьютера и провайдера.',64,601,1148,83,false,24);
}
// 15
{
const s=slide('Первый запуск',{dark:true,note:source('README.md; src/components/views/HelpView.js; docs/INTERVIEW_CHECKLIST_RU.md','Для текущей macOS-сборки путь /Applications/Cheating Daddy.app. Из исходников npm install и npm start.')});
const rows=[['01','Откройте Cheating Daddy','Готовое приложение на Mac или npm install и npm start из исходников.'],['02','Настройте модель и свой контекст','Ключ API, язык речи, профиль инструкций и материалы вакансии.'],['03','Проверьте готовность','Убедитесь, что модель отвечает, экран захватывается и звук поступает.'],['04','Начните пробную сессию','Задайте вопрос, прочитайте ответ, добавьте уточнение и откройте History.']];
rows.forEach((r,i)=>{const y=190+i*106;txt(s,r[0],64,y,90,54,40,C.mint,true);txt(s,r[1],183,y,1000,45,30,C.white,true);body(s,r[2],183,y+47,1000,52,true,23);});
}
await fs.writeFile(path.join(dir,'deck.json'),JSON.stringify(P.toProto()));
await fs.mkdir(path.join(dir,'renders'),{recursive:true});
const candidate=path.join(dir,'candidate.pptx');await(await PresentationFile.exportPptx(P)).save(candidate);
for(let i=0;i<P.slides.items.length;i++){const b=await P.export({slide:P.slides.items[i],format:'png',scale:1.5});await fs.writeFile(path.join(dir,'renders',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await b.arrayBuffer()));}
const final=path.join(workspace,'output','Cheating-Daddy-Product-Presentation.pptx');
await finalizePresentation({workspaceDir:workspace,candidatePath:candidate,finalPath:final,pythonExecutable:PY,integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],requiredNativeChartOwnerSlides:[15],materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,receiptPath:path.join(dir,'validation.json')});
console.log(final);
