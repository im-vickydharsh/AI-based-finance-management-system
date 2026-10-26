package com.finance.controller;

import com.finance.model.User;
import com.finance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || password == null || email.trim().isEmpty() || password.trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Email and password are required.");
            return ResponseEntity.badRequest().body(error);
        }

        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            User user = userOpt.get();
            Map<String, Object> resp = new HashMap<>();
            resp.put("id", user.getId());
            resp.put("name", user.getName());
            resp.put("email", user.getEmail());
            return ResponseEntity.ok(resp);
        }

        Map<String, String> error = new HashMap<>();
        error.put("message", "Invalid email or password.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        String email = payload.get("email");
        String password = payload.get("password");

        if (name == null || email == null || password == null || 
            name.trim().isEmpty() || email.trim().isEmpty() || password.trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Full name, email, and password are all required.");
            return ResponseEntity.badRequest().body(error);
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "An account with this email address already exists.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        User newUser = new User(name.trim(), normalizedEmail, password);
        User saved = userRepository.save(newUser);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", saved.getId());
        resp.put("name", saved.getName());
        resp.put("email", saved.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }
}
