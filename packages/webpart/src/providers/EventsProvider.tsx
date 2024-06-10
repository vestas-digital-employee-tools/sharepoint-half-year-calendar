import { Period } from "../types/Period";
import { EventsContext } from "../contexts/EventsContext";
import React, { useMemo, useState } from "react";
import { useSharePoint } from "../hooks/useSharePoint";
import { tokens } from "@fluentui/react-components";
import { useQuery } from "@tanstack/react-query";
import { Event } from "../types/Event";
import { sources as defaultSources } from "../event-sources/sources";
import { EventSource } from "../types/EventSource";

type Props = React.PropsWithChildren<{
    period: Period;
}>;

export function EventsProvider(props: Props) {
    const context = useSharePoint();
    const { properties, spfx } = context;
    const { children, period } = props;
    const [filter, setFilter] = useState("");

    const { periodStart, periodEnd } = useMemo(() => {
        return {
            periodStart: new Date(period.year, period.half === "H1" ? 0 : 5, 1),
            periodEnd: new Date(period.year, period.half === "H1" ? 5 : 11, 31, 23, 59, 59),
        };
    }, [period]);

    const { data: events, isFetched } = useQuery({
        queryKey: ["half-year-calendar-events", period.year, period.half, filter],
        queryFn: async () => {
            let sources = new Array<EventSource>();
            const extensions = properties?.extensions?.filter((e) => e.enabled) ?? [];
            for (const extension of extensions) {
                if (extension.id === "81f8329d-67af-4b07-b59a-78e0120cd9ee") {
                    sources = sources.concat(...defaultSources);
                    continue;
                }
                if (spfx?.components) {
                    try {
                        const component = await spfx.components.loadComponentById(extension.id);
                        sources = sources.concat(component.sources);
                    } catch (e) {
                        console.error(e);
                    }
                } else {
                    console.warn("Skipped");
                }
            }
            
            let events = new Array<Event>();

            if (!properties.sources) {
                return events;
            }

            for (const source of properties.sources) {
                const sourceDefinition = sources.find((s) => s.name === source.name);
                if (!sourceDefinition) {
                    continue;
                }
                try {
                    const sourceEvents = await sourceDefinition.fn(
                        context,
                        { start: periodStart, end: periodEnd },
                        source.properties
                    );
                    events = events.concat(...(sourceEvents ?? []));
                } catch (e) {
                    console.error(`Failed to get events from source '${source.name}'.`);
                    console.error(e);
                }
            }

            for (const event of events) {
                if (!event.color) {
                    event.color = tokens.colorBrandForegroundInvertedHover;
                }
            }

            events.sort((a, b) => a.start.getTime() - b.start.getTime());

            if (filter) {
                events = events.filter(
                    (event) => event.title.toLowerCase().indexOf(filter.toLowerCase()) > -1
                );
            }
            return events;
        },
    });

    return (
        <EventsContext.Provider value={{ isFetched, events: events ?? [], setFilter }}>
            {children}
        </EventsContext.Provider>
    );
}
