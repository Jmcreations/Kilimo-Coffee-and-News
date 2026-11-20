import { Component, signal } from '@angular/core';
import { Hero } from "../hero/hero";
import { NewsPreview } from "../news-preview/news-preview";
import { Header } from "../header/header";
import { NceTicker } from "../nce-ticker/nce-ticker";
import { TrustSection } from '../trust-section/trust-section';
import { NetworkSectionComponent } from "../network-section/network-section";
import { CoffeeGradesComponent } from "../coffee-grades/coffee-grades";
import { DataTeaser } from "../data-teaser/data-teaser";
import { InquiryPage } from "../inquiry-page/inquiry-page";

@Component({
  selector: 'app-root',
  imports: [
    Hero,
    NewsPreview,
    Header,
    NceTicker,
    TrustSection,
    NetworkSectionComponent,
    CoffeeGradesComponent,
    DataTeaser,
    InquiryPage
],
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {}
