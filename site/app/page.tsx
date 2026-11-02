import Link from "next/link";
import { Header, LeadForm, TaskLink } from "@/app/ui";
import { siteConfig } from "@/lib/config";
import { Reviews } from "@/app/reviews";
import { publishedReviews } from "@/lib/reviews";
import content from "@/content/site.json";
import experts from "@/content/experts.json";
import reviewContent from "@/content/reviews.json";

const situations = [
  ["01", "Маркетинг есть. Системы нет.", "Реклама, сайт и соцсети живут отдельно. Поможем связать их с продуктом, продажами и общей задачей бизнеса.", "Систематизировать маркетинг"],
  ["02", "Расходы видны. Отдача — не всегда.", "Разберём рекламу, путь клиента и аналитику. Определим, каких данных не хватает для решений по бюджету.", "Разобраться в эффективности"],
  ["03", "Новый проект. Много неизвестных.", "Нужно вывести продукт на рынок или запустить направление? Соберём последовательный план: от предложения до продвижения.", "Запустить новое направление"],
];

export default function Home() {
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": "#practice", name: content.brand.title, member: experts.map(expert => ({ "@id": `#expert-${expert.id}` })) },
    ...experts.map(expert => ({ "@type": "Person", "@id": `#expert-${expert.id}`, name: expert.name, jobTitle: expert.role, knowsAbout: expert.focus })),
    { "@type": "Service", name: "Маркетинговый консалтинг", provider: { "@id": "#practice" }, serviceType: "Маркетинговый консалтинг для малого и среднего бизнеса", areaServed: [{ "@type": "Country", name: "Беларусь" }, { "@type": "City", name: "Минск" }], ...(siteConfig.url ? { url: siteConfig.url } : {}) },
    { "@type": "FAQPage", mainEntity: content.faq.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ] };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <Header />
    <main id="main">
      <section className="collective-hero section-wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" />{content.location} <span className="eyebrow-divider">/</span> B2B · B2C</p>
          <p className="hero-specialty">{content.audience}</p>
          <h1 id="hero-title">{content.hero.title}<br /><em>{content.hero.subtitle}</em></h1>
          <p className="hero-summary">{content.hero.intro}</p>
          <div className="hero-actions"><a className="button button-primary" href="#contact">{content.hero.button}<span aria-hidden="true">↗</span></a><a className="quiet-link" href="#experts">Наши эксперты <span aria-hidden="true">↓</span></a></div>
          <p className="hero-note">{content.hero.note}</p>
        </div>
        <div className="expertise-visual">
          <div className="expertise-orbit" aria-hidden="true"><span className="orbit-ring outer" /><span className="orbit-ring inner" /><span className="orbit-center">БИЗНЕС<span>ВАША ЗАДАЧА</span></span><span className="orbit-tag strategy">Стратегия</span><span className="orbit-tag implementation">Реализация</span><span className="orbit-tag evaluation">Контроль</span><span className="orbit-spark">✦</span></div>
          <a className="hero-expert-teaser" href={`#expert-${experts[0].id}`}><span className="teaser-label">Знакомьтесь с экспертом</span><strong>{experts[0].name}</strong><span>{experts[0].role}</span><span className="teaser-arrow" aria-hidden="true">↗</span></a>
        </div>
      </section>
      <div className="expertise-strip"><div className="section-wrap"><span>Практический опыт</span><p>Производство и продукты</p><i /><p>Услуги для бизнеса</p><i /><p>Клиентские сервисы</p><i /><p>Запуск проектов</p></div></div>
      <section id="situations" className="section-wrap section-space situations" aria-labelledby="situations-title">
        <div className="section-heading"><div><p className="section-label">С чем можно прийти</p><h2 id="situations-title">Когда нужен<br />свежий взгляд и план.</h2></div><p className="section-description">Необязательно приходить с готовым брифом.<br />Достаточно рассказать, что хочется изменить.</p></div>
        <div className="situation-grid">{situations.map(([n, title, text, task]) => <article className="situation" key={n}><span className="situation-number">{n} /</span><h3>{title}</h3><p>{text}</p><TaskLink task={task}>Это про мой бизнес <span aria-hidden="true">↗</span></TaskLink></article>)}</div>
      </section>
      <section id="experts" className="experts-section section-space" aria-labelledby="experts-title"><span id="experience" className="anchor-alias" aria-hidden="true" /><div className="section-wrap">
        <div className="section-heading"><div><p className="section-label">Задача бизнеса. Конкретная экспертиза.</p><h2 id="experts-title">Люди, которые<br />разбираются в деле.</h2></div><p className="section-description">За рекомендациями стоит практический опыт. Познакомьтесь с экспертизой и выберите, с кем обсудить свою задачу.</p></div>
        <div className="expert-profiles">{experts.map(expert => <article id={`expert-${expert.id}`} className="expert-profile" key={expert.id} aria-labelledby={`${expert.id}-name`}>
          <div className="expert-identity"><p className="expert-role">{expert.role}</p><h3 id={`${expert.id}-name`}>{expert.name}</h3><p className="expert-positioning">{expert.positioning}</p><p className="expert-summary">{expert.summary}</p><ul className="expert-focus" aria-label="Специализация">{expert.focus.map(focus => <li key={focus}>{focus}</li>)}</ul><TaskLink task={expert.task}>Обсудить задачу с экспертом <span aria-hidden="true">↗</span></TaskLink></div>
          <div className="expert-practice"><p className="expert-practice-label">Практика, полезная вашему бизнесу</p>{expert.practice.map(item => <div className="expert-practice-item" key={item.title}><p className="practice-category">{item.category}</p><h4>{item.title}</h4><p>{item.experience}</p><p className="expert-client-value"><span>Для вашей задачи</span>{item.value}</p></div>)}</div>
        </article>)}</div>
      </div></section>
      <section id="services" className="services section-wrap section-space" aria-labelledby="services-title"><div className="section-heading"><div><p className="section-label">Форматы сотрудничества</p><h2 id="services-title">Подключаемся там,<br />где нужна опора.</h2></div><p className="section-description">От разбора одного вопроса до сопровождения.<br />Объём, условия и ожидаемый результат согласуем до старта.</p></div><div className="services-list">{content.services.map(({ title, description }, i) => <article className="service-row" key={title}><span>{String(i + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{description}</p><TaskLink task={title}><span className="sr-only">Обсудить: {title}</span><span aria-hidden="true">↗</span></TaskLink></article>)}</div></section>
      <section id="consulting" className="collective-approach section-space"><div className="section-wrap approach-layout"><div><p className="section-label">Общий принцип работы</p><h2>Сначала бизнес.<br />Затем инструменты.</h2><a className="button button-light" href="#contact">Расскажите о своей задаче <span aria-hidden="true">↗</span></a></div><div className="approach-text"><p className="approach-lead">Хороший план помогает принимать решения. И достаточно понятен, чтобы по нему действовать.</p><p>Начинаем с продукта, клиентов и целей. Разбираем, что уже работает, где теряется связь с продажами и что стоит проверить прежде, чем увеличивать расходы.</p><p>Под задачу определяем нужную экспертизу и согласуем ответственного специалиста. В плане учитываем и стратегию, и реализацию: что сделать, кто участвует и как оценить результат.</p><div className="engagement-principles"><span>Понятная задача</span><span>Ответственный эксперт</span><span>Согласованный план</span></div></div></div></section>
      <section id="process" className="process section-wrap section-space" aria-labelledby="process-title"><div className="section-heading"><div><p className="section-label">Как начнём</p><h2 id="process-title">От разговора —<br />к совместной работе.</h2></div><p className="section-description">Первое обращение помогает понять запрос.<br />Дальше выбираем подходящий формат.</p></div><ol className="process-steps">{[
        ["Расскажите о ситуации", "Что происходит в бизнесе, что уже пробовали и в чём нужна помощь. Можно начать с короткого сообщения."],
        ["Определим нужную экспертизу", "Уточним цели и ограничения. Обсудим, какой эксперт и формат работы подходят вашей задаче."],
        ["Согласуем работу", "Определим объём, стоимость, ответственного эксперта и порядок взаимодействия. Зафиксируем ожидаемый результат."],
      ].map(([title, text], i) => <li key={title}><div className="step-line"><span>0{i + 1}</span><i /></div><h3>{title}</h3><p>{text}</p></li>)}</ol></section>
      <Reviews reviews={publishedReviews(reviewContent)} />
      <section id="questions" className="faq section-wrap section-space"><div className="faq-intro"><p className="section-label">Полезно до старта</p><h2>Остались<br />вопросы?</h2><p>Можно задать свой вопрос<br />в Telegram или в заявке.</p></div><div className="faq-list">{content.faq.map(({ question, answer }) => <details key={question}><summary>{question}<span aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>
      <section id="contact" className="contact-section section-space"><div className="section-wrap contact-layout"><div className="contact-intro"><p className="section-label"><span className="contact-dot" />Начнём с вашей задачи</p><h2>Давайте разберёмся,<br /><em>куда двигаться дальше.</em></h2><p>Расскажите о бизнесе и оставьте удобный контакт.<br />Или напишите нам напрямую.</p><div className="contact-links"><a href={siteConfig.telegram} target="_blank" rel="noopener noreferrer"><span>Написать в Telegram</span><span aria-hidden="true">↗</span></a><a href={siteConfig.phoneHref}>{siteConfig.phone}<span aria-hidden="true">↗</span></a>{siteConfig.contact && <a href={siteConfig.contact.href}>{siteConfig.contact.label}</a>}</div><div className="contact-footnote">Группа экспертов · Маркетинговый консалтинг<br />Для малого и среднего бизнеса в Минске и Беларуси</div></div><LeadForm available={process.env.LEAD_INTAKE_ENABLED === "true" && !!process.env.OWNER_NAME && !!process.env.OWNER_CONTACT && (!!process.env.SUPABASE_URL && !!process.env.SUPABASE_SECRET_KEY || !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID)} /></div></section>
    </main>
    <footer className="footer section-wrap"><a href="#" className="brand"><span className="signature-mark team-mark" aria-hidden="true">✦</span><span>{content.brand.title}<small>{content.brand.descriptor}</small></span></a><p>Задача. Экспертиза. Решение.</p><div><a href={siteConfig.telegram}>Telegram</a><a href={siteConfig.phoneHref}>{siteConfig.phone}</a><Link href="/privacy">Обработка данных</Link><span>© 2026</span></div></footer>
  </>;
}
