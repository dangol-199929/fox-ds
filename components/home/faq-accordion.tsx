import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqs, TO_CONFIRM } from "@/lib/content";

export function FAQAccordion({ headingId }: { headingId?: string }) {
  return (
    <Accordion aria-labelledby={headingId} className="border-t border-foreground/15">
      {faqs.map((faq) => (
        <AccordionItem key={faq.question} value={faq.question}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>
            {!faq.confirmed && (
              <span className="mb-2 inline-block rounded-full border border-foreground/20 px-2 py-0.5 text-eyebrow font-medium uppercase">
                {TO_CONFIRM}
              </span>
            )}
            <p>{faq.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
