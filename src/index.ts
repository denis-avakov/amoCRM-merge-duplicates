import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { trimTrailingSlash } from "hono/trailing-slash";

import {
  VISITOR_FIELD_ID,
  filterVisitorId,
  searchLeadsByVisitorId,
} from "./amocrm/api";
import { amocrm } from "./amocrm/client";
import { parseFormData } from "./amocrm/webhook";

const app = new Hono({ strict: true });

app.use("*", requestId());
app.use(trimTrailingSlash());

app.get("/", async (context) => {
  return context.text("Hey!!");
});

app.post("/webhook-trigger", async (context, next) => {
  try {
    const requestId = context.get("requestId");
    const formData = await context.req.formData();
    const formDataFields = parseFormData(formData);

    console.log(`[${requestId}]`, formDataFields);

    // early exit if it's trigger not from telegram integration
    if (!formDataFields.sourceUid?.includes("amojo:telegram")) {
      return next();
    }

    // early exit if no leadId is provided
    if (!formDataFields.leadId) {
      return next();
    }

    let visitorId = formDataFields.visitorValue;
    const currentLeadId = Number(formDataFields.leadId);

    // if visitorId is not provided, retrieve it from API
    if (formDataFields.visitorId !== VISITOR_FIELD_ID.toString()) {
      const currentLead = await amocrm.leads.getById(currentLeadId);
      visitorId = filterVisitorId(currentLead?.getAttributes());
    }

    // validate visitorId
    if (!visitorId || typeof visitorId !== "string" || visitorId.length < 10) {
      return next();
    }

    // check for all leads associated with the same visitor
    const allLeadsForVisitor = await searchLeadsByVisitorId(visitorId);
    const websiteLead = allLeadsForVisitor.filter(
      (lead) => lead.id !== currentLeadId
    );

    // ensure that there is no more than 2 leads (one from webhook and one from history)
    if (allLeadsForVisitor.length > 2 || websiteLead.length !== 1) {
      console.log(
        `[${requestId}] Leads result validation failed. Leads count: ${allLeadsForVisitor.length}, Website lead count: ${websiteLead.length}`
      );

      return next();
    }

    // update leads if conditions are met
    await amocrm.leads.update([
      // telegram integration
      {
        id: currentLeadId,
        custom_fields_values: websiteLead[0].custom_fields_values,
      },

      // out own website integration
      {
        id: websiteLead[0].id,
        status_id: 143, // Closed and not implemented
        loss_reason_id: 19431014, // Duplicate
      },
    ]);
  } catch (error) {
    console.error(`[${requestId}] Error processing webhook trigger`, error);
  }

  await next();
});

export default app;
