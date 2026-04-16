package com.secureshare.config;

import com.secureshare.entity.User;
import com.secureshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class AppConfig {

    private final UserRepository userRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            com.secureshare.entity.User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

            return new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPassword(),
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
            );
        };
    }

    @Bean
    public Path uploadPath() {
        Path path = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(path);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + uploadDir, e);
        }
        return path;
    }

    @Bean
    public CommandLineRunner initAdminUser(PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByEmail("admin@gmail.com")) {
                User admin = User.builder()
                        .name("Admin User")
                        .email("admin@gmail.com")
                        .password(passwordEncoder.encode("admin123"))
                        .role("ADMIN")
                        .organization("SecureShare Admin")
                        .build();
                userRepository.save(admin);
                System.out.println("Default admin user created: admin@gmail.com / admin123");
            } else {
                // If it already exists, forcefully update the password to ensure it is correctly encrypted
                User admin = userRepository.findByEmail("admin@gmail.com").orElse(null);
                if (admin != null) {
                    admin.setPassword(passwordEncoder.encode("admin123"));
                    userRepository.save(admin);
                    System.out.println("Default admin password reset to 'admin123' to ensure encryption was applied.");
                }
            }
        };
    }
}
