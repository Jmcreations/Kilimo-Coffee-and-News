import { Component } from '@angular/core';

interface NetworkPartner {
  type: string;
  name: string;
  description: string;
  count: string;
  badge: string;
  badgeColor: string;
  icon: string;
  detail: string;
}

@Component({
  selector: 'app-network-section',
  standalone: true,
  templateUrl: './network-section.html',
  styleUrl: './network-section.scss'
})
export class NetworkSectionComponent {
  hoveredCard: string | null = null;

  networkPartners: NetworkPartner[] = [
    {
      type: 'Licensed Dealer',
      name: 'Nairobi Coffee Exchange Certified Dealers',
      description: 'NCE-licensed trading houses operating under the Coffee Board of Kenya framework with full auction access and export permits.',
      count: '40+ dealers',
      badge: 'NCE Licensed',
      badgeColor: '#2E7D32',
      icon: '🏢',
      detail: 'Direct access to weekly NCE auction lots, certified lot traceability, competitive pricing across all Kenyan grades.',
    },
    {
      type: 'Certified Broker',
      name: 'International & Local Coffee Brokers',
      description: 'Regulated brokerage firms connecting international buyers to Kenyan sellers, facilitating contracts and logistics from farm-gate to export.',
      count: '25+ brokers',
      badge: 'CMA Regulated',
      badgeColor: '#4B3621',
      icon: '🤝',
      detail: 'Contract negotiation support, price discovery, hedging advisory, and relationship management for repeat buyers.',
    },
    {
      type: 'Coffee Estate',
      name: 'Single-Origin Coffee Estates',
      description: 'Established estates across Nyeri, Kirinyaga, Murang\'a, Kiambu, and Embu counties with consistent lot availability and traceable provenance.',
      count: '60+ estates',
      badge: 'Estate Direct',
      badgeColor: '#7B5E3A',
      icon: '🏞️',
      detail: 'Micro-lot availability, GPS-tagged plot traceability, harvest season scheduling, and estate-gate pricing.',
    },
    {
      type: 'Producer',
      name: 'Smallholder Cooperative Producers',
      description: 'Registered cooperative societies representing thousands of smallholder farmers delivering cherry to certified wet mills across Kenya\'s coffee belt.',
      count: '120+ cooperatives',
      badge: 'Co-op Registered',
      badgeColor: '#5C4033',
      icon: '👨‍🌾',
      detail: 'Farm-gate pricing access, cooperative lot aggregation, and direct relationships with farmer group leadership.',
    },
  ];

  stats = [
    { label: 'Licensed Dealers', value: '40+' },
    { label: 'Certified Brokers', value: '25+' },
    { label: 'Estates & Cooperatives', value: '180+' },
    { label: 'Counties Covered', value: '12' },
  ];

  setHoveredCard(type: string | null) {
    this.hoveredCard = type;
  }
}