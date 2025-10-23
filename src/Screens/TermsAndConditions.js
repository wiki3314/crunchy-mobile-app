import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image, StyleSheet, SafeAreaView, Text, View, Vibration, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import CommonButton from '../Components/CommonButton';
import { colors } from '../Constants/colors';
import { commonStyles } from '../Constants/commonStyles';
import { moderateScale, VIBRATION_PATTERN, windowHeight, windowWidth } from '../Constants/globalConstants';
import { imagePath } from '../Constants/imagePath';
import { navigationStrings } from '../Navigation/NavigationStrings';
import Carousel from 'react-native-snap-carousel';
import AuthHeader from '../Components/AuthHeader';


export default function TermsAndConditions(props) {

    const currentThemePrimaryColor = useSelector((state) => state.currentThemePrimaryColor)
    const isDarkModeActive = useSelector((state) => state.isDarkModeActive)
    const currentThemeSecondaryColor = useSelector((state) => state.currentThemeSecondaryColor)
    const route = useRoute()
    const isTermsAndConditions = route?.params?.termsAndConditions || false
    const headerTitle = isTermsAndConditions ? 'Terms and Conditions' : 'Privacy Policy'
    const navigation = useNavigation()

    const renderHeader = (text) => {
        return <Text style={commonStyles.textWhite(22, { fontWeight: 'bold', marginVertical: moderateScale(8), alignSelf: 'flex-start', color: currentThemeSecondaryColor })}>
            {text}
        </Text>
    }

    const renderDescription = (text) => {
        return <Text style={commonStyles.textWhite(14, { color: currentThemeSecondaryColor })}>
            {text}
        </Text>
    }

    const renderTermsAndConditionsText = () => {
        return <View style={styles.screenContainer}>
            {renderHeader('Terms and Conditions')}
            {renderDescription('The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and any or all Agreements: "Client", “User”,“You” and “Your” refers to you, the person accessing this website and accepting the Company’s terms and conditions. bookedyou, “Ourselves”, “We” and "Us", refers to our Company. “Party”, “Parties”, or “Us”, refers to both the Client and ourselves, or either the Client or ourselves.')}
            {renderHeader("Disclaimer:")}
            {renderDescription(`Exclusions and Limitations The information on this web site is provided on an "as is" basis. To the fullest extent permitted by law, this Company: Excludes all representations and warranties relating to this website and its contents or which is or may be provided by any affiliates or any other third party, including in relation to any inaccuracies or omissions in this website and/or the Company’s literature; and excludes all liability for damages arising out of or in connection with your use of this website. This includes, without limitation, direct loss, loss of business or profits (whether or not the loss of such profits was foreseeable, arose in the normal course of things or you have advised this Company of the possibility of such potential loss), damage caused to your computer, computer software, systems and programs and the data thereon or any other direct or indirect, consequential and incidental damages. This Company does not however exclude liability for death or personal injury caused by its negligence. The above exclusions and limitations apply only to the extent permitted by law. None of your statutory rights as a consumer are affected.`)}
            {renderHeader("Copyright Notice:")}
            {renderDescription(`Copyright and other relevant intellectual property rights exists on all text relating to the Bookedyou’s services and the full content of this website. This Company’s logo is a registered trademark of this Company in Canada and other countries. The brand names and specific services of this Company featured on this web site are trade marked.`)}
            {renderHeader("Photo Upload and Sharing:")}
            {renderDescription(`In order to maintain the dignity of our service and site, Bookedyou requests that you only post picture that are deemed respectable and appropriate. Each member may post a profile picture but this picture must me of the individual and is recommended that you post a front profile face picture. Any member posting nude, sexual, derogatory or offensive photos might face account suspension pending an investigation. Please note that any photo’s portraying illegal such as but not limited to child pornography, rape, assault, might be referred to the appropriate authorities.`)}
            {renderHeader("Harassment:")}
            {renderDescription(`Any user that is harassed by another user is encouraged to come forth and identify the perpetrator. Bookedyou has a zero tolerance for any form of harassment, this includes but not limited to; bullying, racism, sexism, issuing threats etc. Any user committing these offences will have their account automatically suspended. Should you feel that you have been wrongfully accused please send us an email, which could be found on out “Contact Us” page located on our landing page. Please Note that any user wrongfully accusing another will also face account suspension.`)}
            {renderHeader("Communication:")}
            {renderDescription(` We have several different e-mail addresses for different queries. These, & other contact information, can be found on our Contact Us link on our website or via Company literature or via the Company’s stated telephone, facsimile or mobile telephone numbers.`)}
            {renderHeader("Waiver:")}
            {renderDescription(`Failure of either Party to insist upon strict performance of any provision of this or any Agreement or the failure of either Party to exercise any right or remedy to which it, he or they are entitled hereunder shall not constitute a waiver thereof and shall not cause a diminution of the obligations under this or any Agreement. No waiver of any of the provisions of this or any Agreement shall be effective unless it is expressly stated to be such and signed by both Parties.`)}
            {renderHeader("General:")}
            {renderDescription(`The laws of Canadian constitution govern these terms and conditions. By accessing this website, you consent to these terms and conditions and to the exclusive jurisdiction of the English courts in all disputes arising out of such access. If any of these terms are deemed invalid or unenforceable for any reason (including, but not limited to the exclusions and limitations set out above), then the invalid or unenforceable provision will be severed from these terms and the remaining terms will continue to apply. Failure of the Company to enforce any of the provisions set out in these Terms and Conditions and any Agreement, or failure to exercise any option to terminate, shall not be construed as waiver of such provisions and shall not affect the validity of these Terms and Conditions or of any Agreement or any part thereof, or the right thereafter to enforce each and every provision. These Terms and Conditions shall not be amended, modified, varied or supplemented except in writing and signed by duly authorized representatives of the Company.`)}
            {renderHeader("Notification of Changes:")}
            {renderDescription(`The Company reserves the right to change these conditions from time to time as it sees fit and your continued use of the site will signify your acceptance of any adjustment to these terms. If there are any changes to our privacy policy or terms and conditions, we will announce that these changes have been made on our home page and on other key pages on our site. If there are any changes in how we use our site customers’ Personally Identifiable Information, notification by e-mail or postal mail will be made to those affected by this change. Any changes to our privacy policy will be posted on our web site at least 30 days prior to these changes taking place. You are therefore advised to re-read this statement on a regular basis`)}
            {renderDescription(`These terms and conditions form part of the Agreement between the User/Client and ourselves. Your accessing of this website and/or undertaking of a booking or Agreement indicates your understanding, agreement to and acceptance.`)}
        </View>
    }

    const renderPrivacyPolicyText = () => {
        return <View style={styles.screenContainer}>
            {renderHeader("Privacy Statement:")}
            {renderDescription(`The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and any or all Agreements: "Client", “User”,“You” and “Your” refers to you, the person accessing this website and accepting the Company’s terms and conditions. crunchii, “Ourselves”, “We” and "Us", refers to our Company. “Party”, “Parties”, or “Us”, refers to both the Client and ourselves, or either the Client or ourselves. Please Note: Our privacy policy may change without notice, however crunchii will try to give our user’s advanced 30day notice when possible. We are committed to protecting your privacy. We constantly review our systems and data to ensure the best possible service to our users. Parliament has created specific offences for unauthorized actions against computer systems and data. We will investigate any such actions with a view to prosecuting and/or taking civil proceedings to recover damages against those responsible`)}
            {renderHeader("Confidentiality:")}
            {renderDescription(`User /client records are regarded as confidential and therefore will not be divulged to any third party, other than if legally (court ordered warrant) required to do so to the appropriate authorities. Users/client’s have the right to request sight of, and copies of any and all User/client Records we keep, providing that we are given reasonable notice of such a request. Users/clients are requested to retain copies of any literature issued in relation to the provision of our services. Where appropriate, we shall issue Users/clients with appropriate written information, handouts or copies of records as part of an agreed contract, for the benefit of both parties. We will not sell, share, or rent your personal information to any third party or use your e-mail address for unsolicited mail but reserve the right to sell information for statistical purpose (i.e. Age, gender etc.) This information may be collected as a whole to collect broad demographics of our users. Any emails sent by this Company will only be in connection with the provision of agreed services and products.`)}
            {renderHeader("Log Files:")}
            {renderDescription(`We use IP addresses to analyze trends, administer the site, track user’s movement, and gather broad demographic information for aggregate use and maybe sold to a third party that is seeking broad statistical data BUT NOT PERSONAL DATA. IP addresses are not linked to personally identifiable information. Additionally, for systems administration, detecting usage patterns and troubleshooting purposes, our web servers automatically log standard access information including browser type, access times/open mail, URL requested, and referral URL. This information is not shared with third parties and is used only within this Company on a need-to-know basis. Any individually identifiable information related to this data will never be used in any way different to that stated above without your explicit permission.`)}
            {renderHeader("Cookies:")}
            {renderDescription(`Like most interactive web sites this Company’s website [or ISP] uses cookies to enable us to retrieve user details for each visit. Cookies are used in some areas of our site to enable the functionality of this area and ease of use for those people visiting. Some of our affiliate partners may also use cookies.`)}
        </View>
    }

    const renderText = () => {
        return isTermsAndConditions ? renderTermsAndConditionsText() : renderPrivacyPolicyText()
    }

    return (
        <SafeAreaView style={[commonStyles.flexFull, { backgroundColor: currentThemePrimaryColor }]}>
            <AuthHeader title={headerTitle} />
            <View style={commonStyles.flexFull}>
                <ScrollView style={commonStyles.flexFull}>
                    {renderText()}
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        padding: moderateScale(10)
    }
})