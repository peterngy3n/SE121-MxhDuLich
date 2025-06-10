import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
      },

    logo:{
        marginTop: 0,
        width:35,
        height:35,
        marginLeft: 10,
    },

    search: {
        marginTop: 30,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: '#F3F8FE',
        width: '85%',
      },
    icon: {
        width: 20, 
        height: 20, 
        marginRight: 10,
        color:'black',
      },
    input: {
        flex: 1,
        height: 40,
        color: '#000000',
      },
    header: {
        borderWidth: 1,
        height: 250,
    },
    text_container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    text1: {
        fontSize: 18,
        marginLeft: '12%',
    },
    text2: {
        fontSize: 36,
        marginLeft: '12%',
        fontWeight: '500',
    },
    text3: {
        fontSize: 14,
        marginRight: '10%',
    },
    textInputContainer: {
        marginTop: 20,
        marginHorizontal: '5%',
        borderRadius: 24,
        backgroundColor: '#A8CCF0',
        opacity: 0.2,
        height: '25%',
        padding: 20,
    },
    textInput: {
        fontSize: 14,
    },
    categoryContainer: {},
    flatList: {
        marginTop: 10,
    },
    body: {
        flex: 1,
        marginBottom: '0%',
    },
    popularList: {},
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent background
    },
    modalContent: {
        height:'50%',
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
    },
    dropdownContainer: {
        position: 'absolute',
        top: 60, // Adjust this depending on where you want the dropdown to appear
        left: 10,
        right: 10,
        maxHeight: 400,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        zIndex: 1, // Ensure the dropdown appears on top
    },
    locationItem: {
        padding: 10,
        fontSize: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    messageButton: {
        top: 16,
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 16,
        elevation: 5,
    },
});