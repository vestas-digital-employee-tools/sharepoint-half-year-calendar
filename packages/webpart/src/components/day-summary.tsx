import React, { useMemo } from "react";
import { useEvents } from "../hooks/useEvents";

type Props = {
    year: number;
    month: number;
    day: number;
    events: ReturnType<typeof useEvents>["events"];
};

export function DaySummary(props: Props) {
    const { year, month, day, events } = props;

    const date = new Date(year, month, day);
    const dayShort = new Intl.DateTimeFormat("default", { weekday: "short" }).format(date);

    const formatEvents = useMemo(() => {
        const dateTimeFormat = new Intl.DateTimeFormat("default", { timeStyle: "short" } as any);
        const relativeFormat = new Intl.RelativeTimeFormat("en", {
            style: "long",
            numeric: "auto",
        });

        const formatTime = (eventDate?: Date) => {
            if (!eventDate) {
                return "";
            }

            if (
                eventDate.getFullYear() === year &&
                eventDate.getMonth() === month &&
                eventDate.getDate() === day
            ) {
                return dateTimeFormat.format(eventDate);
            }

            const millisecondsDiff = eventDate.getTime() - date.getTime();

            const daysDiff = Math.floor(millisecondsDiff / (24 * 60 * 60 * 1000));

            const relative = relativeFormat.format(daysDiff, "day");
            switch (relative) {
                case "tomorrow":
                    return "next day";
                case "yesterday":
                    return "previous day";
                default:
                    return relative;
            }
        };

        return (events ?? []).map((event) => {
            return {
                start: formatTime(event.start),
                end: formatTime(event.end),
                title: event.title,
                color: event.color,
            };
        });
    }, [events]);

    return (
        <div className="flex flex-row gap-1">
            <div>
                <div className="text-3xl text-center">{day}</div>
                <div className="text-center">{dayShort}</div>
            </div>

            <div>
                {formatEvents.map((event, index) => (
                    <div
                        key={`event-${index}`}
                        className="p-2 m-2 min-w-72"
                        style={{ backgroundColor: event.color }}>
                        <div className="font-semibold">{event.title}</div>
                        <div>
                            {event.start} - {event.end}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
