import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

const WEEK_DAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function parseLocalValue(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toLocalValue(date, includeTime, hour = "00", minute = "00") {
  const dateValue = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return includeTime ? `${dateValue}T${pad(hour)}:${pad(minute)}` : dateValue;
}

function toDateOnly(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildCalendarDays(month) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => (
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
  ));
}

function sameDay(left, right) {
  return Boolean(left && right)
    && left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function clampTime(value, maximum) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 2);
  if (!digits) return "";
  return String(Math.min(Number(digits), maximum));
}

const DateTimeInput = forwardRef(function DateTimeInput({
  className = "",
  disabled = false,
  error,
  fullWidth = false,
  helperText,
  id,
  label,
  max,
  min,
  name,
  onChange,
  placeholder,
  required = false,
  type = "datetime-local",
  value = "",
  ...props
}, forwardedRef) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error || helperText ? `${inputId}-description` : undefined;
  const includeTime = type === "datetime-local";
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const currentValue = parseLocalValue(value);
  const initialDate = currentValue ?? new Date();
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(initialDate);
  const [visibleMonth, setVisibleMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [hour, setHour] = useState(pad(initialDate.getHours()));
  const [minute, setMinute] = useState(pad(initialDate.getMinutes()));
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  function assignRef(node) {
    triggerRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }

  useEffect(() => {
    function handleOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openPicker() {
    const selected = parseLocalValue(value) ?? new Date();
    setDraftDate(selected);
    setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setHour(pad(selected.getHours()));
    setMinute(pad(selected.getMinutes()));
    setOpen((current) => !current);
  }

  function emit(nextValue) {
    onChange?.({
      target: { name, value: nextValue, type },
      currentTarget: { name, value: nextValue, type },
    });
  }

  function isUnavailable(date) {
    const candidate = toDateOnly(date);
    return (min && candidate < String(min).slice(0, 10))
      || (max && candidate > String(max).slice(0, 10));
  }

  function applyValue() {
    if (!draftDate) return;
    emit(toLocalValue(
      draftDate,
      includeTime,
      pad(Math.min(Number(hour || 0), 23)),
      pad(Math.min(Number(minute || 0), 59)),
    ));
    setOpen(false);
    triggerRef.current?.focus();
  }

  function selectToday() {
    const today = new Date();
    setDraftDate(today);
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setHour(pad(today.getHours()));
    setMinute(pad(today.getMinutes()));
  }

  function clearValue() {
    emit("");
    setOpen(false);
    triggerRef.current?.focus();
  }

  const displayValue = currentValue
    ? `${DATE_FORMATTER.format(currentValue)}${includeTime ? ` · ${pad(currentValue.getHours())}:${pad(currentValue.getMinutes())}` : ""}`
    : (placeholder ?? (includeTime ? "Choisir une date et une heure" : "Choisir une date"));

  return (
    <div
      className={`ui-field ui-date-field ${fullWidth ? "ui-field-full" : ""} ${error ? "ui-field-invalid" : ""} ${open ? "is-open" : ""} ${className}`}
      ref={rootRef}
    >
      {label ? <label className="ui-field-label" htmlFor={inputId}>{label}</label> : null}
      <span className="ui-date-shell">
        <button
          {...props}
          aria-describedby={descriptionId}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-invalid={Boolean(error)}
          aria-required={required}
          className={`ui-date-trigger ${currentValue ? "has-value" : ""}`}
          disabled={disabled}
          id={inputId}
          onClick={openPicker}
          ref={assignRef}
          type="button"
        >
          <span>{displayValue}</span>
          <span className="ui-date-icon" aria-hidden="true" />
        </button>

        {open ? (
          <span className="ui-date-popover" role="dialog" aria-label={includeTime ? "Choisir la date et l'heure" : "Choisir la date"}>
            <span className="ui-date-popover-head">
              <strong>{MONTH_FORMATTER.format(visibleMonth)}</strong>
              <span className="ui-date-month-actions">
                <button
                  aria-label="Mois précédent"
                  onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  type="button"
                >←</button>
                <button
                  aria-label="Mois suivant"
                  onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  type="button"
                >→</button>
              </span>
            </span>

            <span className="ui-date-weekdays" aria-hidden="true">
              {WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}
            </span>
            <span className="ui-date-grid">
              {calendarDays.map((date) => {
                const outsideMonth = date.getMonth() !== visibleMonth.getMonth();
                const selected = sameDay(date, draftDate);
                const today = sameDay(date, new Date());
                return (
                  <button
                    aria-label={DATE_FORMATTER.format(date)}
                    aria-pressed={selected}
                    className={`${outsideMonth ? "is-outside" : ""} ${selected ? "is-selected" : ""} ${today ? "is-today" : ""}`}
                    disabled={isUnavailable(date)}
                    key={toDateOnly(date)}
                    onClick={() => setDraftDate(date)}
                    type="button"
                  >{date.getDate()}</button>
                );
              })}
            </span>

            {includeTime ? (
              <span className="ui-date-time-row">
                <span className="ui-date-time-label">Heure</span>
                <label>
                  <span>HH</span>
                  <input
                    aria-label="Heures"
                    inputMode="numeric"
                    onBlur={() => setHour(pad(Math.min(Number(hour || 0), 23)))}
                    onChange={(event) => setHour(clampTime(event.target.value, 23))}
                    value={hour}
                  />
                </label>
                <strong>:</strong>
                <label>
                  <span>MM</span>
                  <input
                    aria-label="Minutes"
                    inputMode="numeric"
                    onBlur={() => setMinute(pad(Math.min(Number(minute || 0), 59)))}
                    onChange={(event) => setMinute(clampTime(event.target.value, 59))}
                    value={minute}
                  />
                </label>
              </span>
            ) : null}

            <span className="ui-date-footer">
              <span>
                <button className="ui-date-link" onClick={clearValue} type="button">Effacer</button>
                <button className="ui-date-link" onClick={selectToday} type="button">Aujourd’hui</button>
              </span>
              <button className="ui-date-apply" onClick={applyValue} type="button">Valider</button>
            </span>
          </span>
        ) : null}

        {name ? <input name={name} type="hidden" value={value} /> : null}
      </span>
      {error ? <span className="ui-field-message ui-field-error" id={descriptionId}>{error}</span> : helperText ? <span className="ui-field-message" id={descriptionId}>{helperText}</span> : null}
    </div>
  );
});

export default DateTimeInput;
