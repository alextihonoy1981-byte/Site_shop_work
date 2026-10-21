import Link from "next/link";
import { Header, LeadForm, TaskLink } from "@/app/ui";
import { siteConfig } from "@/lib/config";
import { Reviews } from "@/app/reviews";
import { publishedReviews } from "@/lib/reviews";
import content from "@/content/site.json";
import reviewContent from "@/content/reviews.json";

const situations = [
  ["01", "Маркетинг есть.\nОбщей картины нет.", "Реклама, сайт и соцсети работают по отдельности. Хочется понять, как связать их с задачами бизнеса.", "Систематизировать маркетинг"],
  ["02", "Бюджет уходит.\nВопросы остаются.", "Хочется разобраться, что дают расходы на продвижение и какие показатели действительно стоит отслеживать.", "Разобраться в эффективности"],
  ["03", "Пора двигаться дальше.\nС чего начать?", "Нужен взгляд со стороны, чтобы обсудить идеи, расставить приоритеты и выбрать следующий шаг.", "Определить приоритеты"],
];
const questions = content.faq;
function Symbol({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 56 56" fill="none" aria-hidden="true"><path d="M9 45V11h15v19l23-19v34H32V26L9 45Z" fill="currentColor" /></svg>;
}
export default function Home() {
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "Service", name: "Маркетинговый консалтинг", serviceType: "Маркетинговый консалтинг для малого и среднего бизнеса", areaServed: [{ "@type": "Country", name: "Беларусь" }, { "@type": "City", name: "Минск" }], ...(siteConfig.url ? { url: siteConfig.url } : {}) },
    { "@type": "FAQPage", mainEntity: questions.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ] };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <Header />
    <main id="main">
      <section className="hero section-wrap" aria-labelledby="hero-title">
        <div className="hero-intro"><span className="location"><i />{content.location}</span><span className="hero-category">{content.audience}</span></div>
        <h1 id="hero-title">{content.hero.title}<br /><span>{content.hero.subtitle}</span></h1>
        <div className="hero-bottom">
          <div className="hero-description"><p>{content.hero.intro.split("\n").map((line, i) => <span key={i}>{i > 0 && <><br className="desktop-break" />{" "}</>}{line}</span>)}</p><p className="muted">{content.hero.description.split("\n").map((line, i) => <span key={i}>{i > 0 && <><br className="desktop-break" />{" "}</>}{line}</span>)}</p><a className="button button-primary" href="#contact">{content.hero.button} <span aria-hidden="true" className="arrow-icon" /></a><span className="hero-note">{content.hero.note}</span></div>
          <div className="route-visual" role="img" aria-label="Путь консультации: ваша задача, взгляд со стороны, следующий шаг">
            <div className="route-heading"><span>От вопроса к ясности</span><Symbol /></div>
            <div className="route-path"><div className="route-node node-one"><span className="node-dot" /><span>Ваша задача</span><small>С чего начинаем</small></div><div className="route-connector"><span /></div><div className="route-node node-two"><span className="node-dot" /><span>Взгляд со стороны</span><small>Что стоит рассмотреть</small></div><div className="route-connector"><span /></div><div className="route-node node-three"><span className="node-dot" /><span>Следующий шаг</span><small>К чему идём</small><span className="route-check" aria-hidden="true">✓</span></div></div>
            <div className="route-caption"><span>Внимание к контексту</span><span>Понятный разговор</span></div>
          </div>
        </div>
        <div className="hero-footer"><span>Сначала понять. Затем действовать.</span><a href="#situations">Познакомимся ближе <span aria-hidden="true">↓</span></a></div>
      </section>
      <section id="situations" className="situations section-wrap section-space" aria-labelledby="situations-title">
        <div className="section-heading"><p className="section-label">С чем можно прийти</p><h2 id="situations-title">У каждого бизнеса<br />свой вопрос к маркетингу</h2><p className="section-description">Необязательно знать ответ заранее.<br />Начать можно с ситуации, которую хочется изменить.</p></div>
        <div className="situation-grid">{situations.map(([n, title, text, task]) => <article className="situation" key={n}><span className="situation-number">{n}</span><h3>{title.split("\n").map((line, i) => <span key={line}>{i > 0 && <br />}{line}</span>)}</h3><p>{text}</p><TaskLink task={task}>Это про мой бизнес <span aria-hidden="true" className="arrow-icon" /></TaskLink></article>)}</div>
      </section>
      <section id="services" className="services section-wrap section-space"><div className="section-heading"><p className="section-label">Чем можем помочь</p><h2>От первого вопроса<br />до работы над результатом</h2><p className="section-description">Можно начать с одной консультации<br />или обсудить последовательную работу.</p></div><div className="services-list">{content.services.map(({ title, description }, i) => <article className="service-row" key={title}><span>{String(i + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{description}</p><TaskLink task={title}><span className="sr-only">Обсудить: {title}</span><span aria-hidden="true" className="arrow-icon" /></TaskLink></article>)}</div></section>
      <section id="consulting" className="consulting section-space">
        <div className="section-wrap consulting-layout"><div className="consulting-intro"><p className="section-label">О чём поговорим</p><h2>Посмотрим шире.<br />Разберём по сути.</h2><p>Маркетинг связан с продуктом, клиентами и решениями владельца. Поэтому разговор начинается с контекста вашего бизнеса.</p><div className="focus-graphic" aria-hidden="true"><div className="focus-ring ring-outer" /><div className="focus-ring ring-inner" /><div className="focus-center"><Symbol /><span>Ваша задача</span></div><span className="focus-label label-one">Бизнес</span><span className="focus-label label-two">Клиенты</span><span className="focus-label label-three">Маркетинг</span></div></div><div className="topic-list">{[
          ["Предложение и аудитория", "Кому нужен ваш продукт? За что вас выбирают? Где ожидания клиентов и предложение расходятся?"],
          ["Продвижение и точки контакта", "Как клиент узнаёт о вас? Что он видит на сайте и в рекламе? Что помогает ему обратиться?"],
          ["Данные и ориентиры", "На какие показатели смотреть? Что известно из данных, а какие предположения ещё стоит проверить?"],
          ["Приоритеты и решения", "Какие вопросы важнее сейчас? Что стоит обсудить до новых расходов и запуска очередного инструмента?"],
        ].map(([title, text], i) => <article className="topic" key={title}><span className="topic-index">0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}<p className="topic-note">Конкретный запрос, объём работы и показатели для оценки результата обсудим при знакомстве.</p></div></div>
      </section>
      <section id="process" className="process section-wrap section-space" aria-labelledby="process-title"><div className="section-heading"><p className="section-label">Как начать</p><h2 id="process-title">Большой вопрос.<br />Понятный первый шаг.</h2><p className="section-description">Предлагаем начать с разговора —<br />без сложной подготовки и лишних формальностей.</p></div><ol className="process-steps">{[
        ["Расскажите о задаче", "Оставьте контакт и, если хотите, пару слов о том, что сейчас происходит в бизнесе."],
        ["Обсудим контекст", "Уточним ваш запрос, ожидания и вопросы, с которыми вы хотите разобраться."],
        ["Согласуем дальнейшую работу", "Обсудим подходящий объём, формат и условия. Решение о начале работы остаётся за вами."],
      ].map(([title, text], i) => <li key={title}><div className="step-line"><span>0{i + 1}</span><i /></div><h3>{title}</h3><p>{text}</p></li>)}</ol></section>
      <section className="approach"><div className="section-wrap approach-layout"><div><p className="section-label">На одной стороне</p><h2>Можно без<br />маркетингового<br />словаря.</h2></div><div className="approach-text"><p className="approach-lead">Вы знаете свой бизнес.<br />Мы начнём с того, чтобы вас услышать.</p><p>Можно прийти с конкретным вопросом, сомнением или идеей. Важно разобраться в ситуации и обсудить возможные действия понятным языком.</p><div className="approach-sign"><Symbol /><span>Сначала ваш контекст.<br />Потом инструменты.</span></div></div></div></section>
      <Reviews reviews={publishedReviews(reviewContent)} />
      <section id="questions" className="faq section-wrap section-space"><div className="faq-intro"><p className="section-label">Перед знакомством</p><h2>Возможно,<br />вы хотите спросить</h2><p>Если вашего вопроса здесь нет,<br />напишите его в заявке.</p></div><div className="faq-list">{questions.map(({ question, answer }) => <details key={question}><summary>{question}<span aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>
      <section id="contact" className="contact-section section-space"><div className="section-wrap contact-layout"><div className="contact-intro"><p className="section-label"><span className="contact-dot" />Начнём с разговора</p><h2>Какая задача<br />у вашего бизнеса?</h2><p>Оставьте удобный контакт.<br />Или свяжитесь с нами напрямую.</p><div className="contact-links"><a href={siteConfig.telegram} target="_blank" rel="noopener noreferrer"><span>Написать в Telegram</span><span aria-hidden="true" className="arrow-icon" /></a><a href={siteConfig.phoneHref}>{siteConfig.phone}<span aria-hidden="true" className="arrow-icon" /></a>{siteConfig.contact && <a href={siteConfig.contact.href}>{siteConfig.contact.label}</a>}</div><div className="contact-footnote">Для малого и среднего бизнеса<br />в Минске и по Беларуси</div></div><LeadForm available={process.env.LEAD_INTAKE_ENABLED === "true" && !!process.env.OWNER_NAME && !!process.env.OWNER_CONTACT && (!!process.env.SUPABASE_URL && !!process.env.SUPABASE_SECRET_KEY || !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID)} /></div></section>
    </main>
    <footer className="footer section-wrap"><a href="#" className="brand"><Symbol /><span>Маркетинговый<br />консалтинг</span></a><p>Ясность для следующего шага</p><div><a href={siteConfig.telegram}>Telegram</a><a href={siteConfig.phoneHref}>{siteConfig.phone}</a><Link href="/privacy">Обработка данных</Link><span>© 2026</span></div></footer>
  </>;
}
