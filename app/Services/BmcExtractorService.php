<?php

namespace App\Services;

use App\Models\BusinessPlan;

class BmcExtractorService
{
    public function extract(BusinessPlan $plan): void
    {
        $sections = $plan->planSections
            ->keyBy('section_name');

        $s1 = $this->parseMemory($sections['company_presentation']->memory_summary ?? '');
        $s2 = $this->parseMemory($sections['market_analysis']->memory_summary ?? '');
        $s3 = $this->parseMemory($sections['org_management']->memory_summary ?? '');
        $s4 = $this->parseMemory($sections['strategy']->memory_summary ?? '');
        $s5 = $this->parseMemory($sections['operational_plan']->memory_summary ?? '');
        $s6 = $this->parseMemory($sections['financial_plan']->memory_summary ?? '');

        $bmc = [
            'key_partners'           => $s3['Advisory Board'] ?? $s4['Sales Channels'] ?? 'Not available',
            'key_activities'         => $s5['Delivery Model'] ?? $s5['Key Milestones'] ?? 'Not available',
            'key_resources'          => implode(', ', array_filter([
                                            $s1['Core Product'] ?? '',
                                            $s3['Team Size'] ?? '',
                                            $s5['Infrastructure'] ?? '',
                                        ])) ?: 'Not available',
            'value_propositions'     => $s1['Core Product'] ?? $s1['Mission'] ?? 'Not available',
            'customer_relationships' => $s4['Acquisition Channels'] ?? 'Not available',
            'customer_segments'      => $s2['Target Segment'] ?? 'Not available',
            'channels'               => $s4['Sales Channels'] ?? 'Not available',
            'cost'                   => $s6['Cost Structure'] ?? $s6['Monthly Burn'] ?? 'Not available',
            'revenue_streams'        => $s4['Key Revenue Streams'] ?? $s6['Revenue Y1'] ?? 'Not available',
        ];

        $plan->bmc()->updateOrCreate(
            ['business_plan_id' => $plan->id],
            $bmc
        );
    }

    private function parseMemory(string $raw): array
    {
        $result = [];
        foreach (explode("\n", $raw) as $line) {
            if (str_contains($line, ':')) {
                [$key, $val] = explode(':', $line, 2);
                $result[trim($key)] = trim($val);
            }
        }
        return $result;
    }
}