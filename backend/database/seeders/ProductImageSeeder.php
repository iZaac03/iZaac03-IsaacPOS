<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductImageSeeder extends Seeder
{
    public function run(): void
    {
        $images = [
            'BEV-SMB-001' => 'https://images.unsplash.com/photo-1608270199049-577cf3a98528?auto=format&fit=crop&w=400&h=400&q=80',
            'BEV-KOP-002' => 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&h=400&q=80',
            'BEV-C2-003'  => 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&h=400&q=80',
            'BEV-WLK-004' => 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&h=400&q=80',
            'BEV-SEL-005' => 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&h=400&q=80',
            'GRO-LM-001'  => 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&h=400&q=80',
            'GRO-LM-002'  => 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&h=400&q=80',
            'GRO-DP-003'  => 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&h=400&q=80',
            'GRO-SS-004'  => 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&h=400&q=80',
            'GRO-PFC-005' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&h=400&q=80',
            'GRO-CEN-006' => 'https://images.unsplash.com/photo-1598449356475-b9f71db7d847?auto=format&fit=crop&w=400&h=400&q=80',
            'GRO-BBD-007' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&h=400&q=80',
            'SNK-PIA-001' => 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&h=400&q=80',
            'SNK-NOV-002' => 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=400&h=400&q=80',
            'SNK-OIS-003' => 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&h=400&q=80',
            'PER-SAF-001' => 'https://images.unsplash.com/photo-1607006314633-875f6ca68160?auto=format&fit=crop&w=400&h=400&q=80',
            'PER-COL-002' => 'https://images.unsplash.com/photo-1559591937-e1032c23f219?auto=format&fit=crop&w=400&h=400&q=80',
            'PER-PAL-003' => 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&h=400&q=80',
            'HOU-SRF-001' => 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=400&h=400&q=80',
            'HOU-DWN-002' => 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&h=400&q=80',
            'HOU-JOY-003' => 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=400&h=400&q=80',
            'DUT-MLK-292' => 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&h=400&q=80',
        ];

        foreach ($images as $sku => $url) {
            Product::where('sku', $sku)->update(['image_url' => $url]);
        }
    }
}
