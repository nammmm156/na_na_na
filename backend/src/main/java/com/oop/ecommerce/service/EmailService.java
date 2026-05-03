package com.oop.ecommerce.service;

import com.oop.ecommerce.model.Product;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Autowired
    public EmailService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    @Async
    public void sendPurchaseConfirmation(String toEmail, Product product, int quantity) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(toEmail);
            message.setSubject("Purchase Confirmation: " + product.getName());
            
            String text = "Dear Customer,\n\n" +
                    "Thank you for your purchase!\n\n" +
                    "Order Details:\n" +
                    "Item: " + product.getName() + "\n" +
                    "Quantity: " + quantity + "\n" +
                    "Total Price: " + (product.getPrice().multiply(java.math.BigDecimal.valueOf(quantity))) + "VND" + "\n\n" +
                    "We hope you enjoy your purchase.\n\n" +
                    "Best regards,\nShoeshop Ecommerce Team";
            
            message.setText(text);
            javaMailSender.send(message);
            System.out.println("Email sent successfully to " + toEmail);
        } catch (Exception e) {
            System.err.println("Error sending email to " + toEmail + ": " + e.getMessage());
        }
    }
}
