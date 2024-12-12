import type { LeadAttributes } from "amocrm-js/dist/api/activeRecords/Lead";
import { get } from "es-toolkit/compat";
import { amocrm } from "./client";

export const VISITOR_FIELD_ID = 749197;

export async function getCommonLeads() {
  const pagination = await amocrm.leads.get({
    order: "updated_at",
  });

  return pagination.getData().map((item) => item.getAttributes());
}

type UnsortedLeadsResponse = {
  _page: number;
  _links: {
    self: {
      href: string;
    };
  };
  _embedded: {
    unsorted: {
      uid: string;
      source_uid: string;
      source_name: string;
      category: string;
      pipeline_id: number;
      created_at: number;
      account_id: number;
      metadata: {
        from: string;
        to: string;
        received_at: number;
        service: string;
        last_message_text: number;
        source_name: string;
        client: {
          name: string;
          avatar: string;
        };
        origin: {
          chat_id: string;
          ref: string;
          visitor_uid: string | null;
        };
      };
      _links: {
        self: {
          href: string;
        };
      };
      _embedded: {
        contacts: {
          id: number;
          _links: {
            self: {
              href: string;
            };
          };
        }[];
        leads: {
          id: number;
          _links: {
            self: {
              href: string;
            };
          };
        }[];
        companies: {}[];
      };
    }[];
  };
};

export async function getUnsortedLeads() {
  const { data } = await amocrm.request.get<UnsortedLeadsResponse>(
    "/api/v4/leads/unsorted"
  );
  const unsortedLeadsData = get(data, "_embedded.unsorted");

  if (!Array.isArray(unsortedLeadsData)) {
    return [];
  }

  const leadIdsFromUnsorted = unsortedLeadsData
    .map((entry) => get(entry, "_embedded.leads")?.[0]?.id)
    .filter(Boolean);

  const fetchLeadDetails = async (leadId: number) => {
    try {
      return (await amocrm.leads.getById(leadId))?.getAttributes();
    } catch (error) {
      console.error(`Failed to fetch lead details for ID ${leadId}`, error);
      return null;
    }
  };

  const leadDetailsList = await Promise.all(
    leadIdsFromUnsorted.map((leadId) => fetchLeadDetails(leadId))
  );

  return leadDetailsList.filter(Boolean) as LeadAttributes[];
}

export async function searchLeadsByVisitorId(visitorId: string) {
  const unsortedLeads = await getUnsortedLeads();
  const commonLeads = await getCommonLeads();

  return filterLeadsWithVisitorId(
    [...unsortedLeads, ...commonLeads],
    visitorId
  );
}

export function filterLeadsWithVisitorId(
  collection: LeadAttributes[],
  visitorId?: string
) {
  return collection.filter((item) =>
    item.custom_fields_values?.some((field) => {
      if (field.field_id !== VISITOR_FIELD_ID) {
        return false;
      }

      const fieldValue = get(field, "values.[0].value");
      return visitorId ? fieldValue === visitorId : Boolean(fieldValue);
    })
  );
}

export function filterVisitorId(data?: LeadAttributes) {
  const field = data?.custom_fields_values?.filter(
    (field) => field.field_id === VISITOR_FIELD_ID
  );
  return get(field, "[0].values.[0].value") ?? "";
}
