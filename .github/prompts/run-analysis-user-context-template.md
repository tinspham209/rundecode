# Run Analysis User Context Template

Use this template to build the user-context payload sent to Gemini.

Dữ liệu buổi chạy (đã parse từ FIT):

[Session]
- Tổng quãng đường: {{distance_km}} km
- Tổng thời gian: {{total_time_hhmmss}}
- Pace trung bình: {{avg_pace}}
- Nhịp tim trung bình: {{avg_hr}} bpm
- Nhịp tim tối đa: {{max_hr}} bpm
- Cadence trung bình: {{cadence_spm}} spm
- Calories: {{calories}} kcal
- Elevation gain: {{ascent_m}} m
- Elevation loss: {{descent_m_or_na}}
- Nhiệt độ TB/Tối đa: {{avg_temp_or_na}} / {{max_temp_or_na}}

[Lap-by-lap]
{{laps_block}}

[Derived analytics]
- HR drift: {{hr_drift_summary}}
- Pace volatility: {{pace_volatility_summary}}
- Cadence stability: {{cadence_stability_summary}}
- Pause/resume summary: {{pause_resume_summary}}
- Running dynamics: {{running_dynamics_summary}}

Yêu cầu:
- Phân tích theo đúng cấu trúc system prompt.
- Nếu thiếu trường dữ liệu, ghi rõ "không khả dụng" thay vì suy đoán.
- Giữ output là plain text.
