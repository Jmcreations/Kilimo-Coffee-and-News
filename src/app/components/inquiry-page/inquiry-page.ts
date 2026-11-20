import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inquiry-page',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './inquiry-page.html',
  styleUrl: './inquiry-page.scss',
})
export class InquiryPage {
  formData = {
    fullName: '',
    companyName: '',
    country: '',
    email: '',
    beanType: '',
    volume: '',
    grade: '',
    destination: '',
    message: '',
};

submitted= false;

services = [
    'Purchase premium Kenyan coffee from licensed dealers, estates, and producers',
    'Strategic consulting for agriculture investments in Africa',
    'Real-time market intelligence and industry insights',
    'Content development for digital agriculture stakeholders in Kenya',
    'Event management and industry networking opportunities',
  ];

  handleSubmit() {
    this.submitted = true;
    
    // Reset form after 5 seconds
    setTimeout(() => {
      this.submitted = false;
      this.formData = {
        fullName: '',
        companyName: '',
        country: '',
        email: '',
        beanType: '',
        volume: '',
        grade: '',
        destination: '',
        message: '',
      };
    }, 5000);
  }
}
