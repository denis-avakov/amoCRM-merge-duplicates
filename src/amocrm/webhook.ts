export function parseFormData(formData: FormData) {
  const formDataPaths = {
    leadId: [
      "unsorted[add][0][lead_id]",
      "unsorted[update][0][data][leads][id]",
    ],
    visitorId: ["unsorted[update][0][data][leads][custom_fields][0][id]"],
    visitorValue: [
      "unsorted[update][0][data][leads][custom_fields][0][values][0][value]",
    ],
    sourceUid: [
      "unsorted[add][0][source_uid]",
      "unsorted[update][0][source_data][source_uid]",
    ],
  } as const;

  type FormDataPaths = keyof typeof formDataPaths;

  return Object.fromEntries(
    Object.entries(formDataPaths).map((field) => {
      const key = field[0] as FormDataPaths;
      const value = field[1]
        .map((path) => formData.get(path))
        .find(Boolean)
        ?.toString();

      return [key, value];
    })
  ) as { [K in FormDataPaths]: string | undefined };
}
