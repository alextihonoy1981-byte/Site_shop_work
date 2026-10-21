import type { Review } from "@/lib/reviews";
import { siteConfig } from "@/lib/config";

export function Reviews({ reviews }: { reviews: Review[] }) {
  return <section id="reviews" className="reviews section-space" aria-labelledby="reviews-title">
    <div className="section-wrap">
      <div className="section-heading">
        <p className="section-label">Обратная связь</p>
        <h2 id="reviews-title">Отзывы о работе</h2>
        <p className="section-description">Личный опыт, впечатления<br />и обратная связь о сотрудничестве.</p>
      </div>
      {reviews.length > 0 ? <div className="reviews-grid">{reviews.map(review => <figure className="review-card" key={review.id}>
        <div className="review-card-top"><span className="review-quote" aria-hidden="true">“</span>{review.service && <span className="review-service">{review.service}</span>}</div>
        <blockquote><p>{review.text}</p></blockquote>
        <figcaption><span className="review-avatar" aria-hidden="true">{Array.from(review.author)[0].toLocaleUpperCase("ru")}</span><span className="review-author"><strong>{review.author}</strong>{review.context && <span>{review.context}</span>}</span></figcaption>
        {review.sourceUrl && <a className="review-source" href={review.sourceUrl} target="_blank" rel="noopener noreferrer">Открыть оригинал отзыва <span aria-hidden="true">↗</span><span className="sr-only"> (откроется в новой вкладке)</span></a>}
      </figure>)}</div> : <div className="reviews-empty">
        <span className="reviews-empty-icon" aria-hidden="true">“</span>
        <div><h3>Здесь появятся отзывы клиентов</h3><p>Уже работали вместе? Расскажите о своих впечатлениях. С вашего разрешения опубликуем отзыв в этом разделе.</p></div>
        <a className="button reviews-button" href={siteConfig.telegram} target="_blank" rel="noopener noreferrer">Поделиться отзывом <span aria-hidden="true" className="arrow-icon" /><span className="sr-only"> в Telegram (откроется в новой вкладке)</span></a>
      </div>}
      {reviews.length > 0 && <div className="reviews-bottom"><p>Хотите поделиться впечатлениями о нашей работе?</p><a className="text-link" href={siteConfig.telegram} target="_blank" rel="noopener noreferrer">Написать отзыв в Telegram <span aria-hidden="true" className="arrow-icon" /></a></div>}
    </div>
  </section>;
}
