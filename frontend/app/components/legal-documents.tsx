import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface LegalDocumentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
}

function LegalDocumentDialog({ open, onOpenChange, title, children }: LegalDocumentDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col border-2 border-border/30">
                <DialogHeader>
                    <DialogTitle className="text-xl">{title}</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto pr-2 space-y-4 text-sm text-muted-foreground">{children}</div>
            </DialogContent>
        </Dialog>
    );
}

export function TermsOfServiceDialog({ open, onOpenChange }: Omit<LegalDocumentDialogProps, 'title' | 'children'>) {
    return (
        <LegalDocumentDialog open={open} onOpenChange={onOpenChange} title="Terms of Service">
            <p className="text-xs">Last updated: October 2026</p>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h3>
                <p>
                    By creating an account or using VolleyConnect, you agree to be bound by these Terms of
                    Service. If you do not agree to these terms, please do not use the platform.
                </p>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">2. Description of Service</h3>
                <p>
                    VolleyConnect is a community platform that helps volleyball players find games, connect
                    with other players, and manage their volleyball activities. Features include game
                    discovery, player profiles, game creation, and social connections between players.
                </p>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">3. User Accounts</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>You must provide accurate and complete information when creating an account.</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                    <li>You are responsible for all activity that occurs under your account.</li>
                    <li>You must notify us immediately of any unauthorized use of your account.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">4. Acceptable Use</h3>
                <p>You agree not to use VolleyConnect to:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Harass, bully, or intimidate other players or community members.</li>
                    <li>Post false, misleading, or fraudulent game listings or profile information.</li>
                    <li>Impersonate any person or entity.</li>
                    <li>Interfere with or disrupt the platform or its infrastructure.</li>
                    <li>Collect or harvest information about other users without their consent.</li>
                    <li>Use the platform for any unlawful purpose.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">5. Game Listings and Participation</h3>
                <p>
                    Game organizers are responsible for the accuracy of their game listings, including
                    location, time, and skill level requirements. VolleyConnect is not liable for the
                    conduct of participants or the outcome of games organized through the platform. Participation
                    in any game is at your own risk.
                </p>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">6. Content</h3>
                <p>
                    You retain ownership of the content you post. By posting content, you grant VolleyConnect a
                    non-exclusive, worldwide license to display and distribute that content in connection with
                    operating the platform. You may delete your content and close your account at any time.
                </p>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">7. Limitation of Liability</h3>
                <p>
                    The platform is provided &ldquo;as is&rdquo; without warranties of any kind. VolleyConnect
                    shall not be liable for any indirect, incidental, or consequential damages arising from
                    your use of the platform.
                </p>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">8. Changes to These Terms</h3>
                <p>
                    We may update these Terms of Service from time to time. Continued use of the platform
                    after changes take effect constitutes acceptance of the updated terms.
                </p>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">9. Contact</h3>
                <p>
                    If you have questions about these Terms of Service, please contact us through the
                    support options available on the platform.
                </p>
            </section>
        </LegalDocumentDialog>
    );
}

export function PrivacyPolicyDialog({ open, onOpenChange }: Omit<LegalDocumentDialogProps, 'title' | 'children'>) {
    return (
        <LegalDocumentDialog open={open} onOpenChange={onOpenChange} title="Privacy Policy">
            <p className="text-xs">Last updated: October 2026</p>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">1. Information We Collect</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        <span className="text-foreground font-medium">Account information:</span> your name,
                        email address, and password when you register.
                    </li>
                    <li>
                        <span className="text-foreground font-medium">Profile information:</span> display
                        name, avatar, location, skill level, positions, and bio that you choose to provide.
                    </li>
                    <li>
                        <span className="text-foreground font-medium">Usage data:</span> games you create or
                        join, players you follow, and other interactions with the platform.
                    </li>
                    <li>
                        <span className="text-foreground font-medium">Location data:</span> approximate or
                        precise location when you share game locations or enable location-based features.
                    </li>
                </ul>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">2. How We Use Your Information</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>To provide and maintain the platform&apos;s features.</li>
                    <li>To connect you with games and other players.</li>
                    <li>To send notifications about games, followers, and account activity.</li>
                    <li>To improve and personalize your experience.</li>
                    <li>To detect and prevent fraud or abuse.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">3. Information Sharing</h3>
                <p>
                    We do not sell your personal information. We share information only in the following
                    circumstances:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>With other users, as needed to facilitate games and connections (e.g., your display name and profile).</li>
                    <li>With service providers that help us operate the platform.</li>
                    <li>When required by law or to protect the rights and safety of our users.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">4. Data Security</h3>
                <p>
                    We use industry-standard measures to protect your information, including encryption of
                    data in transit and at rest. However, no method of transmission over the internet is
                    completely secure, and we cannot guarantee absolute security.
                </p>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">5. Your Choices</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>You can update or delete your profile information at any time.</li>
                    <li>You can manage your notification preferences in your account settings.</li>
                    <li>You can delete your account, which will remove your personal information from our systems.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">6. Data Retention</h3>
                <p>
                    We retain your information for as long as your account is active or as needed to provide
                    the service. You may request deletion of your data by closing your account.
                </p>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">7. Third-Party Services</h3>
                <p>
                    The platform may use third-party services, such as OAuth providers (Google, Facebook) for
                    authentication. These services have their own privacy policies, and we encourage you to
                    review them.
                </p>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">8. Changes to This Policy</h3>
                <p>
                    We may update this Privacy Policy from time to time. We will notify you of significant
                    changes through the platform or by email.
                </p>
            </section>

            <section className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">9. Contact</h3>
                <p>
                    If you have questions about this Privacy Policy or our data practices, please contact us
                    through the support options available on the platform.
                </p>
            </section>
        </LegalDocumentDialog>
    );
}
