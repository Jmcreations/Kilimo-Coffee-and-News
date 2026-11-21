import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  private authService = inject(AuthService);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.redirectByRole();
    }
  }

  onSubmit(): void {
    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.email.trim(), this.password).subscribe({
      next: (res) => {
        this.loading = false;
        this.authService.redirectByRole(res.user.role);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Invalid credentials. Please try again.';
      }
    });
  }
}
