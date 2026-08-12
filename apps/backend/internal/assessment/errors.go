package assessment

import "errors"

var (
	ErrNotDraftOrNotFound   = errors.New("assessment tidak ditemukan atau bukan berstatus draft")
	ErrQuestionCountExceeds = errors.New("question_count melebihi jumlah soal yang tersedia di bank")
	ErrInvalidTimeRange     = errors.New("start_time harus sebelum end_time")
	ErrNoParticipants       = errors.New("assessment belum memiliki peserta, tidak bisa dipublish")
)
