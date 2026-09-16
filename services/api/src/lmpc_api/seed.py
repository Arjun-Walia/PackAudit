"""LMPC Inspect — Official Legal Metrology Seed Dataset.

Defines standardized seed records for inspecting officers, controllers,
tenants, commodities, and statutory inspection findings.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

# Standard Tenancy Records
TENANT_GOVERNMENT = UUID("018f2c9a-0001-7000-8000-000000000001")
TENANT_PACKER = UUID("018f2c9a-0002-7000-8000-000000000002")

SEED_TENANTS = [
    {
        "id": str(TENANT_GOVERNMENT),
        "name": "Legal Metrology Organization, Maharashtra Zone",
        "type": "government",
        "district_code": "MH-PUN",
    },
    {
        "id": str(TENANT_PACKER),
        "name": "Western India Packaged Commodities Compliance Cell",
        "type": "packer",
        "district_code": "MH-PUN",
    },
]

# Official User Credentials & Profiles
SEED_USERS = [
    {
        "id": "018f2c9a-0010-7000-8000-000000000010",
        "email": "officer@demo.lmpc",
        "display_name": "Inspector Rajesh V. Kulkarni",
        "role": "officer",
        "officer_code": "MH-LM-2024-0412",
        "district_code": "MH-PUN",
        "tenant_id": str(TENANT_GOVERNMENT),
    },
    {
        "id": "018f2c9a-0020-7000-8000-000000000020",
        "email": "controller@demo.lmpc",
        "display_name": "Controller Sunita Deshmukh",
        "role": "controller",
        "officer_code": "MH-CTRL-104",
        "district_code": "MH-PUN",
        "tenant_id": str(TENANT_GOVERNMENT),
    },
    {
        "id": "018f2c9a-0030-7000-8000-000000000030",
        "email": "admin@demo.lmpc",
        "display_name": "Administrator Anil Sharma",
        "role": "admin",
        "officer_code": "MH-HQ-001",
        "district_code": "MH-PUN",
        "tenant_id": str(TENANT_GOVERNMENT),
    },
    {
        "id": "018f2c9a-0040-7000-8000-000000000040",
        "email": "packer@demo.lmpc",
        "display_name": "Vikram Malhotra",
        "role": "packer",
        "officer_code": "PKR-CORP-098",
        "district_code": "MH-PUN",
        "tenant_id": str(TENANT_PACKER),
    },
    {
        "id": "018f2c9a-0050-7000-8000-000000000050",
        "email": "auditor@demo.lmpc",
        "display_name": "Auditor Meera Iyer",
        "role": "auditor",
        "officer_code": "CAG-AUD-033",
        "district_code": "MH-PUN",
        "tenant_id": str(TENANT_GOVERNMENT),
    },
]

# Standard FMCG Packaged Commodities
SEED_PRODUCTS = [
    {
        "gtin": "8904004401245",
        "brand": "Haldiram's",
        "generic_name": "Bhujia Sev - Spiced Gram Flour Extruded Snack",
        "net_quantity": "200 g",
        "manufacturer": "Haldiram Foods International Pvt. Ltd., Nagpur - 440035, Maharashtra",
    },
    {
        "gtin": "8901030383854",
        "brand": "Tata Salt",
        "generic_name": "Vacuum Evaporated Iodized Salt",
        "net_quantity": "1 kg",
        "manufacturer": "Tata Consumer Products Limited, 1, Bishop Lefroy Road, Kolkata - 700020",
    },
    {
        "gtin": "8906007281015",
        "brand": "Fortune",
        "generic_name": "Sunlite Refined Sunflower Oil",
        "net_quantity": "1 L",
        "manufacturer": "Adani Wilmar Limited, Fortune House, Near Navrangpura Railway Crossing, Ahmedabad - 380009",
    },
    {
        "gtin": "8901063012011",
        "brand": "Britannia",
        "generic_name": "Good Day Butter Cookies Family Pack",
        "net_quantity": "600 g",
        "manufacturer": "Britannia Industries Limited, 5/1A Hungerford Street, Kolkata - 700017",
    },
    {
        "gtin": "8901207042514",
        "brand": "Dabur",
        "generic_name": "Pure Honey Squeezy Pack",
        "net_quantity": "400 g",
        "manufacturer": "Dabur India Limited, 8/3, Asaf Ali Road, New Delhi - 110002",
    },
]

# Verified Inspection Records with Statutory Findings
SEED_INSPECTIONS = [
    {
        "id": "0191e4a2-7b3e-7821-b12a-3c4d5e6f7001",
        "status": "awaiting_officer",
        "district_code": "MH-PUN",
        "officer_code": "MH-LM-2024-0412",
        "officer_name": "Inspector Rajesh V. Kulkarni",
        "channel": "Retail Supermarket",
        "created_at": "2026-09-14T09:30:00Z",
        "product": SEED_PRODUCTS[0],
        "finding": {
            "rule_id": "lmpc.r7.table_i",
            "clause": "Rule 7(2) read with Table I (Row 3)",
            "gazette": "G.S.R. 629(E) dated 23.06.2017",
            "status": "proposed",
            "decision": "accepted",
            "severity": "major",
            "summary": "MRP numeral height 1.8 ± 0.2 mm is below mandatory 2.5 mm threshold for PDP area 120 cm².",
            "metrics": {
                "measured_mm": 1.8,
                "required_mm": 2.5,
                "pdp_area_cm2": 120.0,
                "uncertainty_mm": 0.2,
                "band": "fail",
            },
            "officer_note": "Verified physical discrepancy. Area of principal display panel measured at 120 cm². Table I Sl. 3 mandates minimum numeral height of 2.5 mm; measured height 1.8 mm is non-compliant.",
        },
    },
    {
        "id": "0191e4a2-7b3e-7821-b12a-3c4d5e6f7002",
        "status": "reported",
        "district_code": "MH-PUN",
        "officer_code": "MH-LM-2024-0412",
        "officer_name": "Inspector Rajesh V. Kulkarni",
        "channel": "Wholesale Distribution",
        "created_at": "2026-09-15T11:15:00Z",
        "product": SEED_PRODUCTS[1],
        "finding": {
            "rule_id": "lmpc.r6.consumer_care",
            "clause": "Rule 6(1)(h)",
            "gazette": "G.S.R. 629(E) dated 23.06.2017",
            "status": "proposed",
            "decision": "accepted",
            "severity": "major",
            "summary": "Consumer care electronic contact identifier (email) omitted from packaging declaration.",
            "metrics": {
                "phone_present": True,
                "email_present": False,
                "band": "fail",
            },
            "officer_note": "Statutory violation verified under Rule 6(1)(h). Back label omitted mandatory customer care email address. Consumer care postal address and telephone were printed, but electronic grievance contact is absent.",
        },
    },
    {
        "id": "0191e4a2-7b3e-7821-b12a-3c4d5e6f7003",
        "status": "awaiting_officer",
        "district_code": "MH-PUN",
        "officer_code": "MH-LM-2024-0412",
        "officer_name": "Inspector Rajesh V. Kulkarni",
        "channel": "Retail Kirana",
        "created_at": "2026-09-15T14:40:00Z",
        "product": SEED_PRODUCTS[2],
        "finding": {
            "rule_id": "lmpc.r6.usp",
            "clause": "Rule 6(1)(e) read with Rule 7",
            "gazette": "G.S.R. 629(E) dated 23.06.2017",
            "status": "proposed",
            "decision": "pending",
            "severity": "minor",
            "summary": "Unit Sale Price declaration format requires verification per unit volume (1 L).",
            "metrics": {
                "mrp_inr": 145.0,
                "usp_inr_per_l": 145.0,
                "band": "review",
            },
            "officer_note": "",
        },
    },
    {
        "id": "0191e4a2-7b3e-7821-b12a-3c4d5e6f7004",
        "status": "awaiting_officer",
        "district_code": "MH-PUN",
        "officer_code": "MH-LM-2024-0412",
        "officer_name": "Inspector Rajesh V. Kulkarni",
        "channel": "Retail Supermarket",
        "created_at": "2026-09-16T09:10:00Z",
        "product": SEED_PRODUCTS[3],
        "finding": {
            "rule_id": "lmpc.r9.contrast",
            "clause": "Rule 9(1)",
            "gazette": "LMPC Rules 2011",
            "status": "proposed",
            "decision": "rejected",
            "severity": "minor",
            "summary": "Visual contrast on metallic foil wrapper verified compliant under ambient light.",
            "metrics": {
                "contrast_ratio": 3.2,
                "band": "pass",
            },
            "officer_note": "Physical examination confirms contrast ratio 3.2:1 against matte gold backing is compliant with Rule 9(1) under diffused lighting. Specular reflection during preliminary scan produced an initial false flag.",
        },
    },
    {
        "id": "0191e4a2-7b3e-7821-b12a-3c4d5e6f7005",
        "status": "awaiting_officer",
        "district_code": "MH-PUN",
        "officer_code": "MH-LM-2024-0412",
        "officer_name": "Inspector Rajesh V. Kulkarni",
        "channel": "E-Commerce Fulfillment Hub",
        "created_at": "2026-09-16T11:00:00Z",
        "product": SEED_PRODUCTS[4],
        "finding": {
            "rule_id": "lmpc.r6.date",
            "clause": "Rule 6(1)(d)",
            "gazette": "LMPC Rules 2011",
            "status": "proposed",
            "decision": "pending",
            "severity": "minor",
            "summary": "Packaging date font isolation and legibility requires manual officer confirmation.",
            "metrics": {
                "month": 8,
                "year": 2026,
                "band": "review",
            },
            "officer_note": "",
        },
    },
]


def seed_database() -> dict[str, int]:
    """Execute seed generation and return entity count summary."""
    print("Legal Metrology (LMPC) Seed Initialization")
    print("-" * 50)
    print(f"Tenants seeded      : {len(SEED_TENANTS)}")
    print(f"Users seeded        : {len(SEED_USERS)}")
    print(f"Products registered : {len(SEED_PRODUCTS)}")
    print(f"Inspections logged  : {len(SEED_INSPECTIONS)}")
    print("-" * 50)
    print("Default Inspecting Officer : Inspector Rajesh V. Kulkarni (MH-LM-2024-0412)")
    print("Default Jurisdiction       : Pune Central (Camp Zone), MH-PUN")
    print("Seed initialization complete.")
    return {
        "tenants": len(SEED_TENANTS),
        "users": len(SEED_USERS),
        "products": len(SEED_PRODUCTS),
        "inspections": len(SEED_INSPECTIONS),
    }


if __name__ == "__main__":
    seed_database()
