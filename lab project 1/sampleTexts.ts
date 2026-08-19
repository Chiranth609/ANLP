export interface SampleText {
  id: string;
  title: string;
  text: string;
}

export const sampleTexts: SampleText[] = [
  {
    id: 'hospital',
    title: 'Hospital Opening',
    text: `Apollo Hospital opened a new cancer treatment center in Bengaluru on 5 May 2024. The center was inaugurated by Dr. Meera Iyer in the presence of Health Minister Rajesh Kumar. On 10 May 2024, the hospital admitted its first patient. The patient was diagnosed with stage 3 cancer and started chemotherapy on 15 May 2024. Dr. Iyer supervised the treatment plan and the patient responded well to the therapy.`,
  },
  {
    id: 'business',
    title: 'Corporate Merger',
    text: `Tata Motors acquired a controlling stake in Ford India on 12 January 2023. The acquisition was announced by CEO Ralf Brandstatter at a press conference in Mumbai. Ford India transferred its manufacturing facility in Sanand to Tata Motors on 1 March 2023. The facility employed 3,000 workers and produced 150,000 vehicles annually. Tata Motors invested 2,000 crore rupees to modernize the plant and launched a new electric vehicle on 15 August 2023.`,
  },
  {
    id: 'politics',
    title: 'Diplomatic Summit',
    text: `Prime Minister Narendra Modi met President Joe Biden in Washington on 22 June 2023. The two leaders signed a defense cooperation agreement and discussed trade relations between India and the United States. Modi addressed the Indian diaspora at the Ronald Reagan Building on 23 June 2023. The Prime Minister visited France on 14 July 2023 and President Emmanuel Macron hosted a banquet at the Elysee Palace. Modi and Macron signed agreements for collaboration in artificial intelligence and space research.`,
  },
];
