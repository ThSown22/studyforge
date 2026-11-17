import type { Pool } from 'pg';
import type { SavedWordSummary, ReviewEventSummary } from '@studyforge/contracts';
import { HttpError } from '../../shared/errors.ts';
import { record } from '../../shared/validation.ts';

interface QueueRow { id:string; term:string; collection_id:string; collection_name:string; status:'new'|'learning'|'known'; saved_at:Date; personal_note:string|null }
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export class ReviewService {
  private readonly db:Pool;
  constructor(db:Pool){this.db=db;}
  async queue(userId:string,collectionId?:string):Promise<SavedWordSummary[]>{
    if(collectionId&&!uuid.test(collectionId))throw new HttpError(400,'INVALID_ID','ID bộ sưu tập không hợp lệ.');
    const result=await this.db.query<QueueRow>(`SELECT sw.id,l.term,sw.collection_id,c.name AS collection_name,sw.status,sw.saved_at,sw.personal_note
      FROM saved_words sw JOIN lexemes l ON l.id=sw.lexeme_id JOIN collections c ON c.id=sw.collection_id
      WHERE sw.user_id=$1 AND ($2::uuid IS NULL OR sw.collection_id=$2::uuid)
      ORDER BY CASE sw.status WHEN 'new' THEN 0 WHEN 'learning' THEN 1 ELSE 2 END,sw.saved_at ASC LIMIT 200`,[userId,collectionId??null]);
    return result.rows.map(row=>({id:row.id,term:row.term,collectionId:row.collection_id,collectionName:row.collection_name,status:row.status,savedAt:row.saved_at.toISOString(),personalNote:row.personal_note}));
  }
  async record(userId:string,body:unknown):Promise<ReviewEventSummary>{
    const input=record(body);
    if(typeof input.savedWordId!=='string'||!uuid.test(input.savedWordId))throw new HttpError(400,'INVALID_ID','ID từ không hợp lệ.');
    const rating=input.rating==null?(input.correct===true?3:input.correct===false?1:NaN):Number(input.rating);
    if(!Number.isInteger(rating)||rating<1||rating>3)throw new HttpError(400,'INVALID_REVIEW','Mức độ ghi nhớ phải từ 1 đến 3.');
    const correct=typeof input.correct==='boolean'?input.correct:rating>=2;
    const duration=Number(input.durationMs);
    if(!Number.isInteger(duration)||duration<0||duration>3600000)throw new HttpError(400,'INVALID_REVIEW','Thời gian ôn tập không hợp lệ.');
    const result=await this.db.query<{id:string;saved_word_id:string;review_mode:string;rating:number;correct:boolean;reviewed_at:Date}>(`INSERT INTO review_events(saved_word_id,review_mode,prompt_type,rating,correct,duration_ms)
      SELECT sw.id,'self_flashcard','term_to_meaning',$3,$4,$5 FROM saved_words sw WHERE sw.id=$2 AND sw.user_id=$1
      RETURNING id,saved_word_id,review_mode,rating,correct,reviewed_at`,[userId,input.savedWordId,rating,correct,duration]);
    const row=result.rows[0];if(!row)throw new HttpError(404,'WORD_NOT_FOUND','Không tìm thấy từ để ôn.');
    return{id:row.id,savedWordId:row.saved_word_id,reviewMode:row.review_mode,rating:row.rating,correct:row.correct,reviewedAt:row.reviewed_at.toISOString()};
  }
}
