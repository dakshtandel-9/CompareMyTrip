"use client";

import { ArrowLeftRight, CarFront, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { visibleFields, type FieldSpec, type ServiceSpec, type Values } from "./services";
import { isOutstationTrip, localDateValue, MAX_TRANSPORT_STOPS } from "./transport";
import styles from "./TransportEnquiry.module.css";

type Props = {
  service: ServiceSpec;
  values: Values;
  errors: Record<string, string>;
  onChange: (name: string, value: string) => void;
};

export default function TransportFields({ service, values, errors, onChange }: Props) {
  const fields = visibleFields(service, values);
  const tripType = service.fields.find((field) => field.name === "tripType");
  const stopCount = Math.min(MAX_TRANSPORT_STOPS, Number(values.stopCount) || 0);
  const addStopRef = useRef<HTMLButtonElement>(null);
  const [today, setToday] = useState("");
  const isHourly = values.tripType === "hourly";

  useEffect(() => {
    // The browser's calendar date may differ from the server's timezone.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(localDateValue());
  }, []);

  function addStop() {
    flushSync(() => onChange("stopCount", String(stopCount + 1)));
    document.getElementById(`transport-stop${stopCount + 1}`)?.focus();
  }

  function addReturn() {
    flushSync(() => onChange("tripType", "round"));
    document.getElementById("transport-returnDate")?.focus();
  }

  function swapLocations() {
    onChange("from", values.to ?? "");
    onChange("to", values.from ?? "");
  }

  function removeStop(index: number) {
    flushSync(() => {
      for (let position = index; position <= stopCount; position += 1) {
        onChange(`stop${position}`, position < stopCount ? values[`stop${position + 1}`] ?? "" : "");
      }
      onChange("stopCount", String(stopCount - 1));
    });
    addStopRef.current?.focus();
  }

  function renderField(field: FieldSpec) {
    const id = `transport-${field.name}`;
    const error = errors[field.name];
    const hint = field.name === "from"
      ? isHourly ? "City or pickup address" : "City, airport or pickup address"
      : field.name === "to" ? "City, airport or drop-off address" : field.hint;
    const describedBy = [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
    const minDate = field.name === "returnDate" && values.departDate > today ? values.departDate : today;

    return (
      <div key={field.name} className={styles.field}>
        <label htmlFor={id}>
          {field.label} {field.required && <span className="text-cmt-error-500">*</span>}
        </label>
        {field.kind === "select" ? (
          <select id={id} name={field.name} value={values[field.name] ?? ""} onChange={(event) => onChange(field.name, event.target.value)} required={field.required} aria-invalid={Boolean(error)} aria-describedby={describedBy}>
            {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : (
          <input
            id={id}
            name={field.name}
            type={field.kind}
            value={values[field.name] ?? ""}
            onChange={(event) => onChange(field.name, event.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            min={field.kind === "date" ? minDate || undefined : undefined}
            maxLength={field.kind === "text" ? 160 : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
          />
        )}
        {hint && <p id={`${id}-hint`} className={styles.hint}>{hint}</p>}
        {error && <p id={`${id}-error`} className={styles.error}>{error}</p>}
      </div>
    );
  }

  return (
    <section className={styles.journey} aria-label="Transport journey details">
      <div className={styles.heading}>
        <fieldset className={styles.tripTypes}>
          <legend className="sr-only">Transport trip type</legend>
          <div className={styles.tripOptions}>
            {tripType?.options?.map((option, index) => (
              <label key={option.value} className={styles.tripOption}>
                <input id={index === 0 ? "transport-tripType" : `transport-tripType-${option.value}`} type="radio" name="tripType" value={option.value} checked={values.tripType === option.value} onChange={() => onChange("tripType", option.value)} required aria-describedby={errors.tripType ? "transport-tripType-error" : undefined} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {errors.tripType && <p id="transport-tripType-error" className={styles.error}>{errors.tripType}</p>}
        </fieldset>
        <span className={styles.bookingLabel}><CarFront size={18} aria-hidden="true" /> Cab booking enquiry</span>
      </div>

      <div className={`${styles.route} ${isHourly ? styles.hourlyRoute : ""}`}>
        <div className={styles.locations}>
          {fields.filter((field) => field.name === "from").map(renderField)}
          {!isHourly && <>
            <button type="button" onClick={swapLocations} className={styles.swap} aria-label="Swap pickup and drop-off locations"><ArrowLeftRight size={19} aria-hidden="true" /></button>
            {fields.filter((field) => field.name === "to").map(renderField)}
          </>}
        </div>
        {fields.filter((field) => field.name === "departDate").map(renderField)}
        {values.tripType === "oneway" ? (
          <div className={styles.returnPrompt}>
            <span>Return</span>
            <button type="button" onClick={addReturn}>Add a return date<span>Make this a round trip</span></button>
          </div>
        ) : fields.filter((field) => field.name === "returnDate" || field.name === "duration").map(renderField)}
        {fields.filter((field) => field.name === "pickupTime").map(renderField)}
      </div>

      {values.tripType === "airport" && <p className={styles.airportHint}>Include the airport name or terminal in your pickup or drop-off location.</p>}

      {isOutstationTrip(values) && <div className={styles.stops}>
        {stopCount > 0 && <div className={styles.stopFields}>
          {fields.filter((field) => /^stop\d+$/.test(field.name)).map((field, index) => (
            <div key={field.name} className={styles.stopRow}>
              <span className={styles.stopNumber} aria-hidden="true">{index + 1}</span>
              {renderField(field)}
              <button type="button" className={styles.removeStop} aria-label={`Remove stop ${index + 1}`} onClick={() => removeStop(index + 1)}><X size={18} aria-hidden="true" /></button>
            </div>
          ))}
        </div>}
        <button ref={addStopRef} type="button" className={styles.addStop} disabled={stopCount >= MAX_TRANSPORT_STOPS} onClick={addStop}><Plus size={18} aria-hidden="true" /> Add Stops</button>
        <span className={styles.stopsHint}>{stopCount >= MAX_TRANSPORT_STOPS ? "Maximum 5 stops added" : "Plan pickups or breaks along the way"}</span>
      </div>}
    </section>
  );
}
